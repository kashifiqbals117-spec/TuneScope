import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'cyan' | 'violet' | 'amber' | 'rose' | 'muted';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'emerald',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    violet: 'bg-purple-500/10 text-purple-300 border border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    muted: 'bg-slate-800 text-slate-400 border border-slate-700/50',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 rounded-md font-medium',
    md: 'text-xs px-2.5 py-1 rounded-full font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

