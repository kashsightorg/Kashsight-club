import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'outline' }> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const themeVariants = {
      primary: "bg-black text-white hover:bg-gray-900 border border-transparent",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
      danger: "bg-red-600 text-white hover:bg-red-700",
      outline: "bg-white border-2 border-black text-black hover:bg-gray-50"
  }

  return (
    <button className={`${baseStyle} ${themeVariants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 p-5 ${className}`}>
    {children}
  </div>
);

export const Badge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-900 border-amber-200",
    ACTIVE: "bg-blue-100 text-blue-900 border-blue-200",
    PAID: "bg-emerald-100 text-emerald-900 border-emerald-200",
    DEFAULTED: "bg-red-100 text-red-900 border-red-200",
    REJECTED: "bg-gray-100 text-gray-600 border-gray-200"
  };
  
  return (
    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${colors[status] || colors.REJECTED}`}>
      {status}
    </span>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input 
    className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-0 focus:outline-none focus:border-black placeholder-gray-500 text-black transition-all"
    {...props}
  />
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h3 className="font-bold text-lg text-slate-900">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-black text-2xl leading-none">&times;</button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    )
}