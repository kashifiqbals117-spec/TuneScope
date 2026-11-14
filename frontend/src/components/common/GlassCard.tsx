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
      className={`rounded-2xl p-6 bg-dark-900/90 border border-white/[0.07] shadow-xl backdrop-blur-sm transition-all duration-200 ${
        hoverEffect ? 'hover:border-white/[0.14] hover:shadow-2xl hover:translate-y-[-1px]' : ''
      } ${
        gradientBorder
          ? 'relative before:absolute before:inset-0 before:rounded-2xl before:p-[1px] before:bg-gradient-to-r before:from-brand-emerald/30 before:to-brand-cyan/30 before:-z-10'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
