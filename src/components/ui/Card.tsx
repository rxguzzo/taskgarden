import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'glass' | 'solid' | 'danger';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'glass',
  ...props
}) => {
  const baseStyle = 'rounded-2xl p-6 transition-all duration-200';
  
  const variants = {
    glass: 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-emerald-900/10 dark:border-white/10 shadow-sm shadow-emerald-900/5',
    solid: 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm',
    danger: 'bg-red-50/90 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 shadow-sm',
  };

  const currentVariant = variants[variant] || variants.glass;

  return (
    <div className={`${baseStyle} ${currentVariant} ${className}`} {...props}>
      {children}
    </div>
  );
};
