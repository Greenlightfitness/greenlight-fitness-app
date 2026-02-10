import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getChatMessages,
  sendChatMessage,
  markMessagesAsRead,
  subscribeToChatMessages,
  uploadFile,
  getPublicUrl,
  supabase,
} from '../services/supabase';
import { showLocalNotification, NotificationTypes } from '../services/notifications';
import { Send, Mic, MicOff, X, ArrowDown, Check, CheckCheck, Loader2, Lock } from 'lucide-react';
import VoiceMessagePlayer from './VoiceMessagePlayer';

interface CoachChatProps {
  relationshipId: string;
  partnerId: string;
  partnerName: string;
  currentUserId: string;
  hasAccess: boolean;
  onClose?: () => void;
  isFullPage?: boolean;
  hideHeader?: boolean;
}

interface ChatMessage {
  id: string;
  coaching_relationship_id: string;
  sender_id: string;
  receiver_id: string;
  message_type: 'text' | 'voice' | 'system';
  content?: string;
  voice_url?: string;
  voice_duration_seconds?: number;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

const CoachChat: React.FC<CoachChatProps> = ({
  relationshipId,
  partnerId,
  partnerName,
  currentUserId,
  hasAccess,
  onClose,
  isFullPage = false,
  hideHeader = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages
  useEffect(() => {
    if (!relationshipId || !hasAccess) return;
    loadMessages();
  }, [relationshipId, hasAccess]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!relationshipId || !hasAccess) return;

    const channel = subscribeToChatMessages(relationshipId, (newMsg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      // Mark as read if we're the receiver
      if (newMsg.receiver_id === currentUserId) {
        markMessagesAsRead(relationshipId, currentUserId);
      }

      // Show notification if message is from partner
      if (newMsg.sender_id === partnerId) {
        const notif = NotificationTypes.newMessage(partnerName);
        showLocalNotification(notif.title, { body: newMsg.content || 'Sprachnachricht', tag: notif.tag });
      }

      scrollToBottom();
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [relationshipId, hasAccess, currentUserId, partnerId]);

  // Mark messages as read on mount
  useEffect(() => {
    if (relationshipId && hasAccess && currentUserId) {
      markMessagesAsRead(relationshipId, currentUserId);
    }
  }, [relationshipId, hasAccess, currentUserId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await getChatMessages(relationshipId);
      setMessages(data);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShowScrollDown(!isNearBottom);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await sendChatMessage({
        coaching_relationship_id: relationshipId,
        sender_id: currentUserId,
        receiver_id: partnerId,
        message_type: 'text',
        content: text,
      });
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
      setNewMessage(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendVoiceMessage(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const sendVoiceMessage = async (blob: Blob) => {
    setSending(true);
    try {
      const fileName = `voice/${currentUserId}/${Date.now()}.webm`;
      const file = new File([blob], 'voice.webm', { type: 'audio/webm' });
      await uploadFile('chat-audio', fileName, file);
      const voiceUrl = getPublicUrl('chat-audio', fileName);

      await sendChatMessage({
        coaching_relationship_id: relationshipId,
        sender_id: currentUserId,
        receiver_id: partnerId,
        message_type: 'voice',
        voice_url: voiceUrl,
        voice_duration_seconds: recordingTime,
      });
      setRecordingTime(0);
      scrollToBottom();
    } catch (err) {
      console.error('Error sending voice message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatMessageTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Heute';
    if (d.toDateString() === yesterday.toDateString()) return 'Gestern';
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const shouldShowDateSeparator = (idx: number) => {
    if (idx === 0) return true;
    const curr = new Date(messages[idx].created_at).toDateString();
    const prev = new Date(messages[idx - 1].created_at).toDateString();
    return curr !== prev;
  };

  // No access UI
  if (!hasAccess) {
    return (
      <div className={`flex flex-col items-center justify-center text-center p-8 ${isFullPage ? 'h-full' : 'h-96'}`}>
        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
          <Lock size={28} className="text-zinc-500" />
        </div>
        <h3 className="text-white font-bold text-lg mb-2">Chat nicht verfügbar</h3>
        <p className="text-zinc-500 text-sm max-w-xs">
          Der Chat ist nur mit einem aktiven 1:1 Coaching-Paket verfügbar. 
          Upgraden Sie Ihr Paket im Shop.
        </p>
      </div>
    );
  }

  const containerClass = isFullPage
    ? 'flex flex-col h-full bg-[#0A0A0A]'
    : 'flex flex-col h-[500px] bg-[#0A0A0A] border border-zinc-800 rounded-2xl overflow-hidden';

  return (
    <div className={containerClass}>
      {/* Header (hidden when parent provides its own) */}
      {!hideHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#1C1C1E] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#00FF00]/10 border border-[#00FF00]/30 flex items-center justify-center">
              <span className="text-[#00FF00] font-bold text-sm">
                {partnerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">{partnerName}</p>
              <p className="text-[#00FF00] text-[10px] font-medium">Online</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1 scroll-smooth"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-zinc-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <p className="text-sm">Noch keine Nachrichten.</p>
            <p className="text-xs mt-1">Starte die Konversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.sender_id === currentUserId;
            return (
              <React.Fragment key={msg.id}>
                {shouldShowDateSeparator(idx) && (
                  <div className="flex items-center justify-center py-3">
                    <span className="text-[10px] text-zinc-600 bg-zinc-900 px-3 py-1 rounded-full">
                      {formatDateSeparator(msg.created_at)}
                    </span>
                  </div>
                )}
                {msg.message_type === 'system' && msg.content?.startsWith('{') ? (() => {
                  try {
                    const data = JSON.parse(msg.content!);
                    if (data.type === 'attention') {
                      const isInjury = data.attentionType === 'INJURY';
                      const severityColor = data.severity === 'HIGH' ? 'bg-red-500' : data.severity === 'MEDIUM' ? 'bg-orange-500' : 'bg-yellow-500';
                      return (
                        <div className="flex justify-center mb-2">
                          <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${isInjury ? 'bg-red-950/40 border border-red-900/50' : 'bg-zinc-800/50 border border-zinc-700/50'}`}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className={`w-2 h-2 rounded-full ${severityColor} ${data.severity === 'HIGH' ? 'animate-pulse' : ''}`} />
                              <span className={`text-xs font-bold uppercase tracking-wider ${isInjury ? 'text-red-400' : 'text-zinc-400'}`}>
                                {isInjury ? (
                                  <span className="underline decoration-red-500 decoration-2 underline-offset-2 cursor-pointer hover:text-red-300 transition-colors">
                                    {data.label}
                                  </span>
                                ) : data.label}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                data.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                                data.severity === 'MEDIUM' ? 'bg-orange-500/20 text-orange-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {data.severityLabel}
                              </span>
                            </div>
                            <p className={`text-sm leading-relaxed ${isInjury ? 'text-red-200/80' : 'text-zinc-400'}`}>
                              "{data.message}"
                            </p>
                            <div className="text-[10px] text-zinc-600 mt-1.5">
                              {formatMessageTime(msg.created_at)}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  } catch {}
                  return null;
                })() : (
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      msg.message_type === 'system'
                        ? 'bg-zinc-800/50 text-zinc-500 text-xs text-center mx-auto italic'
                        : isMine
                        ? 'bg-[#00FF00] text-black rounded-br-md'
                        : 'bg-[#1C1C1E] text-white border border-zinc-800 rounded-bl-md'
                    }`}
                  >
                    {msg.message_type === 'voice' && msg.voice_url ? (
                      <VoiceMessagePlayer
                        src={msg.voice_url}
                        duration={msg.voice_duration_seconds}
                        isMine={isMine}
                      />
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                    {msg.message_type !== 'system' && (
                      <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[10px] ${isMine ? 'text-black/50' : 'text-zinc-600'}`}>
                          {formatMessageTime(msg.created_at)}
                        </span>
                        {isMine && (
                          msg.is_read
                            ? <CheckCheck size={12} className="text-black/50" />
                            : <Check size={12} className="text-black/40" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                )}
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom */}
      {showScrollDown && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 w-9 h-9 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white shadow-lg transition-colors"
        >
          <ArrowDown size={16} />
        </button>
      )}

      {/* Input */}
      <div className={`px-3 py-3 border-t border-zinc-800 bg-[#1C1C1E] shrink-0 ${hideHeader ? 'safe-area-bottom pb-4' : ''}`}>
        {isRecording ? (
          <div className="flex items-center gap-3">
            <button
              onClick={cancelRecording}
              className="p-2.5 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500/20 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex-1 flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-full px-4 py-2.5">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-sm font-mono">{formatTime(recordingTime)}</span>
              <span className="text-red-400/60 text-xs">Aufnahme läuft...</span>
            </div>
            <button
              onClick={stopRecording}
              className="p-2.5 bg-[#00FF00] text-black rounded-full hover:bg-[#00FF00]/80 transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={startRecording}
              className="p-2.5 text-zinc-500 hover:text-[#00FF00] transition-colors shrink-0"
              title="Sprachnachricht"
            >
              <Mic size={20} />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nachricht schreiben..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:border-[#00FF00]/50 focus:outline-none transition-colors"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className="p-2.5 bg-[#00FF00] text-black rounded-full hover:bg-[#00FF00]/80 transition-colors disabled:opacity-30 disabled:hover:bg-[#00FF00] shrink-0"
            >
              {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachChat;
