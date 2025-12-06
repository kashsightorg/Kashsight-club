import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'outline' }> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-6 py-3 rounded-xl font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide";
  
  const themeVariants = {
      primary: "bg-black text-white hover:bg-slate-800 shadow-lg shadow-slate-200 border border-transparent",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
      danger: "bg-red-600 text-white hover:bg-red-700",
      outline: "bg-transparent border-2 border-black text-black hover:bg-slate-50"
  }

  return (
    <button className={`${baseStyle} ${themeVariants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 p-6 shadow-sm ${className}`}>
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
    <span className={`text-[10px] font-black px-2 py-1 rounded-md border uppercase tracking-wider ${colors[status] || colors.REJECTED}`}>
      {status}
    </span>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <div className="relative group w-full">
    <input 
      className="w-full px-4 py-4 bg-slate-50 border-b-2 border-slate-200 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:bg-slate-100 focus:border-black transition-all duration-300 rounded-t-lg"
      {...props}
    />
    {/* Visual indicator of touch/active state */}
    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 rounded-t-lg"></div>
  </div>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h3 className="font-bold text-lg text-slate-900 uppercase tracking-tight">{title}</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-black font-bold text-xl">&times;</button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    )
}