import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2 mb-4">
      {label && <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{label}</label>}
      <input
        className={`bg-[#1C1C1E] border border-transparent text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#00FF00]/50 focus:bg-zinc-900 placeholder-zinc-600 transition-all font-medium shadow-inner ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;