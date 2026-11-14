import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { getUserFriendlyError } from '../../utils/errors.js';

interface ErrorMessageProps {
  error: any;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  className = '',
}) => {
  if (!error) return null;

  const friendly = getUserFriendlyError(error);

  return (
    <div
      role="alert"
      className={`p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-white tracking-wide">{friendly.title}</p>
          <p className="text-slate-300 mt-0.5 leading-relaxed">{friendly.message}</p>
        </div>
      </div>

      {onRetry && friendly.canRetry && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 font-semibold transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};
