import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  gradientBorder?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  gradientBorder = false,
  ...props
}) => {
  return (
    <div
      className={`glass-panel rounded-2xl p-6 ${
        hoverEffect ? 'glass-card-hover' : ''
      } ${
        gradientBorder ? 'relative before:absolute before:inset-0 before:rounded-2xl before:p-[1px] before:bg-gradient-to-r before:from-brand-emerald/40 before:to-brand-cyan/40 before:-z-10' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

