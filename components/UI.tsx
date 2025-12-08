
import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'outline' }> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-6 py-3 rounded-xl font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide border-2";
  
  const themeVariants = {
      // Primary: Solid Black Background, White Text
      primary: "bg-black text-white border-black hover:bg-slate-800 hover:border-slate-800",
      // Secondary: White Background, Black Text, Black Border
      secondary: "bg-white text-black border-slate-200 hover:border-black",
      // Danger: White Background, Black Text, Bold Border (Minimalist Danger)
      danger: "bg-white text-black border-black hover:bg-black hover:text-white",
      // Outline: Transparent, Black Text/Border
      outline: "bg-transparent border-black text-black hover:bg-black hover:text-white"
  }

  return (
    <button className={`${baseStyle} ${themeVariants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
    {children}
  </div>
);

export const Badge: React.FC<{ status: string }> = ({ status }) => {
  return (
    <span className={`text-[10px] font-black px-2 py-1 rounded-md border border-black uppercase tracking-wider bg-white text-black`}>
      {status}
    </span>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = props.type === 'password';

  return (
    <div className="relative group w-full">
      <input 
        className="w-full px-4 py-4 bg-white border-b-2 border-slate-200 text-black font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:border-black transition-all duration-300 rounded-t-lg"
        {...props}
        type={isPassword ? (showPassword ? 'text' : 'password') : props.type}
      />
      {isPassword && (
        <button 
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black transition-colors"
        >
          {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
        </button>
      )}
      {/* Visual indicator of touch/active state */}
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 rounded-t-lg"></div>
    </div>
  );
};

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md border-2 border-black shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b-2 border-slate-100 flex justify-between items-center bg-white">
                    <h3 className="font-bold text-lg text-black uppercase tracking-tight">{title}</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black hover:text-white transition-colors text-black font-bold text-xl">&times;</button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    )
}
