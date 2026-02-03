import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone, Check, X, Loader2 } from 'lucide-react';
import { 
  getNotificationStatus, 
  requestNotificationPermission, 
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush
} from '../services/notifications';

interface NotificationSettingsProps {
  compact?: boolean;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ compact = false }) => {
  const [status, setStatus] = useState<{
    supported: boolean;
    permission: NotificationPermission;
    pushSupported: boolean;
  }>({ supported: false, permission: 'default', pushSupported: false });
  
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const currentStatus = getNotificationStatus();
      setStatus(currentStatus);
      
      if (currentStatus.permission === 'granted' && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setSubscribed(!!subscription);
      }
    };
    
    checkStatus();
  }, []);

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const permission = await requestNotificationPermission();
      setStatus(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        const registration = await registerServiceWorker();
        if (registration) {
          const subscription = await subscribeToPush(registration);
          setSubscribed(!!subscription);
        }
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
    } catch (error) {
      console.error('Error disabling notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!status.supported) {
    if (compact) return null;
    
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-3 text-zinc-500">
          <BellOff size={20} />
          <span className="text-sm">Benachrichtigungen werden von deinem Browser nicht unterstützt.</span>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={subscribed ? handleDisableNotifications : handleEnableNotifications}
        disabled={loading || status.permission === 'denied'}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
          subscribed 
            ? 'bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/20' 
            : 'bg-zinc-800 text-zinc-400 hover:text-white'
        } disabled:opacity-50`}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : subscribed ? (
          <Bell size={18} />
        ) : (
          <BellOff size={18} />
        )}
        <span className="text-sm font-medium">
          {loading ? 'Wird geladen...' : subscribed ? 'Aktiv' : 'Aktivieren'}
        </span>
      </button>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            subscribed ? 'bg-[#00FF00]/10' : 'bg-zinc-800'
          }`}>
            {subscribed ? (
              <Bell size={20} className="text-[#00FF00]" />
            ) : (
              <BellOff size={20} className="text-zinc-500" />
            )}
          </div>
          <div>
            <h3 className="text-white font-bold">Push-Benachrichtigungen</h3>
            <p className="text-zinc-500 text-xs">
              {status.permission === 'denied' 
                ? 'In Browser-Einstellungen blockiert' 
                : subscribed 
                  ? 'Du erhältst Benachrichtigungen'
                  : 'Erhalte Updates zu deinem Training'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Status</span>
          <div className="flex items-center gap-2">
            {subscribed ? (
              <>
                <div className="w-2 h-2 bg-[#00FF00] rounded-full animate-pulse" />
                <span className="text-[#00FF00]">Aktiv</span>
              </>
            ) : status.permission === 'denied' ? (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-red-400">Blockiert</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-zinc-500 rounded-full" />
                <span className="text-zinc-400">Inaktiv</span>
              </>
            )}
          </div>
        </div>

        {/* Notification Types */}
        {subscribed && (
          <div className="pt-2 space-y-2">
            <p className="text-xs text-zinc-500 font-medium uppercase">Du wirst benachrichtigt bei:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: '📋', label: 'Neue Trainingspläne' },
                { icon: '✅', label: 'Coaching Updates' },
                { icon: '💬', label: 'Neue Nachrichten' },
                { icon: '🏆', label: 'Erreichte Ziele' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        {status.permission !== 'denied' && (
          <button
            onClick={subscribed ? handleDisableNotifications : handleEnableNotifications}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
              subscribed 
                ? 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                : 'bg-[#00FF00] text-black hover:bg-[#00FF00]/80'
            } disabled:opacity-50`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Wird geladen...
              </>
            ) : subscribed ? (
              <>
                <BellOff size={16} />
                Deaktivieren
              </>
            ) : (
              <>
                <Bell size={16} />
                Benachrichtigungen aktivieren
              </>
            )}
          </button>
        )}

        {/* Blocked Notice */}
        {status.permission === 'denied' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-red-400 text-xs">
              Benachrichtigungen wurden in deinen Browser-Einstellungen blockiert. 
              Bitte erlaube Benachrichtigungen für diese Seite in deinen Browser-Einstellungen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;
