import React from 'react';

export const Skeleton: React.FC<{
  className?: string;
  circle?: boolean;
}> = ({ className = '', circle = false }) => {
  return (
    <div
      className={`animate-pulse bg-white/[0.04] border border-white/[0.02] ${
        circle ? 'rounded-full' : 'rounded-xl'
      } ${className}`}
      aria-hidden="true"
    />
  );
};

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`p-6 rounded-2xl bg-dark-900 border border-white/5 space-y-4 animate-pulse ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
};

export const TrackRowSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-white/5 animate-pulse">
      <div className="flex items-center gap-3.5 min-w-0">
        <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
        <div className="space-y-1.5 min-w-0">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-64' }) => {
  return (
    <div
      className={`p-6 rounded-2xl bg-dark-900 border border-white/5 space-y-4 animate-pulse`}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className={`w-full ${height} bg-white/[0.02] rounded-xl flex items-end gap-3 p-4`}>
        {[40, 75, 55, 90, 65, 80, 50].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-white/[0.04] rounded-t-lg"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
};
