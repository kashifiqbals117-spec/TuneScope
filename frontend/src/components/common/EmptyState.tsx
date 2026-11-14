import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  secondaryText?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
  secondaryText,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`py-16 px-6 text-center rounded-2xl bg-dark-900/40 border border-white/5 flex flex-col items-center justify-center max-w-md mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 mb-4">
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-sm">
        {description}
      </p>

      {(actionText || secondaryText) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {actionText && onAction && (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-emerald text-black text-xs font-bold hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/15"
            >
              {actionIcon}
              <span>{actionText}</span>
            </button>
          )}

          {secondaryText && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-dark-800 text-slate-300 border border-white/10 text-xs font-medium hover:bg-dark-700 transition"
            >
              <span>{secondaryText}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
