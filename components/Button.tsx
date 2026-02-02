import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  size = 'md',
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none flex items-center justify-center tracking-tight active:scale-95";
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-6 py-3 text-sm rounded-xl",
    lg: "px-8 py-4 text-base rounded-2xl",
  };

  const variants = {
    primary: "bg-[#00FF00] text-black hover:bg-[#00DD00] shadow-[0_0_20px_rgba(0,255,0,0.3)] hover:shadow-[0_0_25px_rgba(0,255,0,0.5)] border border-transparent",
    secondary: "bg-[#1C1C1E] text-white hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700",
    outline: "bg-transparent border-2 border-[#00FF00] text-[#00FF00] hover:bg-[#00FF00] hover:text-black",
    danger: "bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white",
    ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-white/5",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${widthClass} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;