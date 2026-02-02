import React from 'react';
import Button from './Button';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDangerous = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-lg shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-zinc-800">
          <div className={`p-2 rounded-full ${isDangerous ? 'bg-red-500/10 text-red-500' : 'bg-[#00FF00]/10 text-[#00FF00]'}`}>
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onCancel} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-zinc-300 leading-relaxed">
            {message}
          </p>
          {isDangerous && (
             <p className="mt-4 text-sm text-red-400 bg-red-900/20 border border-red-900/50 p-3 rounded">
                This action cannot be undone. Associated data will be permanently lost.
             </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-950/30 rounded-b-lg">
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button 
            variant={isDangerous ? 'danger' : 'primary'} 
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;