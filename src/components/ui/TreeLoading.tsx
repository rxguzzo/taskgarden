import React from 'react';

type TreeLoadingProps = {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
};

export function TreeLoading({ label, size = 'md', fullScreen = false }: TreeLoadingProps) {
  // Tamanhos dos ícones
  const sizeClasses = {
    sm: 'w-4 h-4 text-emerald-600 dark:text-emerald-400',
    md: 'w-8 h-8 text-emerald-600 dark:text-emerald-400',
    lg: 'w-12 h-12 text-emerald-600 dark:text-emerald-400',
  };

  // Tamanhos dos textos
  const textClasses = {
    sm: 'text-[10px] text-zinc-500 dark:text-zinc-455',
    md: 'text-sm font-medium text-zinc-600 dark:text-zinc-300',
    lg: 'text-base font-semibold text-emerald-800 dark:text-emerald-300',
  };

  const containerContent = (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-2 p-2"
    >
      {/* Ícone de Broto/Folha com animação de pulso/respiração e flutuação */}
      <div className="relative flex items-center justify-center">
        {/* Efeito de pulso de fundo */}
        <div
          className={`absolute rounded-full bg-emerald-500/20 animate-ping ${
            size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-12 h-12' : 'w-18 h-18'
          }`}
        />
        
        {/* SVG do brotinho crescendo / balançando */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`${sizeClasses[size]} animate-bounce`}
          style={{ animationDuration: '2s' }}
        >
          {/* SVG de broto/planta */}
          <path d="M12 2C11.5 2 7 6 7 11C7 14.5 9.5 17 12 17C14.5 17 17 14.5 17 11C17 6 12.5 2 12 2ZM12 15C10.5 15 9 13.5 9 11C9 9 11 6.5 12 5.2C13 6.5 15 9 15 11C15 13.5 13.5 15 12 15Z" />
          <path d="M12 17V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 19C13 19 14.5 18 15 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 21C11 21 9.5 20 9 19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {label && (
        <span className={`${textClasses[size]} tracking-tight text-center animate-pulse`}>
          {label}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
        <div className="bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl max-w-xs w-full">
          {containerContent}
        </div>
      </div>
    );
  }

  return containerContent;
}
