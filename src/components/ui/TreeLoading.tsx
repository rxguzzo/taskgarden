import React from 'react';

type TreeLoadingProps = {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  variant?: 'inline' | 'card' | 'overlay';
};

export function TreeLoading({ label, size = 'md', fullScreen = false, variant }: TreeLoadingProps) {
  // Determina se deve renderizar no modo simplificado/inline
  const isInline = variant === 'inline' || (size === 'sm' && variant !== 'card' && variant !== 'overlay');

  // Determina se deve renderizar no modo overlay
  const isOverlay = variant === 'overlay' || fullScreen;

  // Estilos de animação CSS injetados de forma autocontida
  const keyframesStyle = (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          @keyframes treeSeedDrop {
            0% { transform: translate(-50%, -24px) scale(0.5); opacity: 0; }
            10% { transform: translate(-50%, 0px) scale(1); opacity: 1; }
            25% { transform: translate(-50%, 12px) scale(0.8); opacity: 0.5; }
            30%, 100% { transform: translate(-50%, 14px) scale(0); opacity: 0; }
          }
          @keyframes treeSproutGrow {
            0%, 28% { transform: translate(-50%, 6px) scale(0); opacity: 0; }
            33% { transform: translate(-50%, 6px) scale(0.4); opacity: 0.5; }
            45% { transform: translate(-50%, -2px) scale(1.2) rotate(-8deg); opacity: 1; }
            55% { transform: translate(-50%, 0px) scale(1) rotate(4deg); opacity: 1; }
            62%, 100% { transform: translate(-50%, 2px) scale(0); opacity: 0; }
          }
          @keyframes treeTreeSway {
            0%, 60% { transform: translate(-50%, 6px) scale(0) rotate(0deg); opacity: 0; }
            64% { transform: translate(-50%, 4px) scale(0.5) rotate(0deg); opacity: 0.3; }
            75% { transform: translate(-50%, -4px) scale(1.1) rotate(-6deg); opacity: 1; }
            85% { transform: translate(-50%, -2px) scale(1) rotate(4deg); opacity: 1; }
            95% { transform: translate(-50%, 0px) scale(1) rotate(0deg); opacity: 0.8; }
            100% { transform: translate(-50%, 6px) scale(0) rotate(0deg); opacity: 0; }
          }
          @keyframes treeSwaySimple {
            0%, 100% { transform: rotate(-5deg); }
            50% { transform: rotate(5deg); }
          }
        `,
      }}
    />
  );

  if (isInline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-1.5 align-middle text-xs font-semibold text-current shrink-0"
      >
        {keyframesStyle}
        <span
          className="inline-block text-sm"
          style={{
            transformOrigin: 'bottom center',
            animation: 'treeSwaySimple 1.4s ease-in-out infinite',
          }}
        >
          🌱
        </span>
        {label && <span className="opacity-90">{label}</span>}
      </div>
    );
  }

  // Layout completo (card ou overlay)
  const content = (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 py-6 text-center"
    >
      {keyframesStyle}

      {/* Container da Animação do Cultivo da Planta */}
      <div className="relative h-20 w-24 overflow-hidden">
        {/* Efeito de Solo */}
        <div className="absolute bottom-4 left-1/2 h-2 w-16 -translate-x-1/2 rounded-full bg-emerald-950/20 dark:bg-emerald-450/20" />

        {/* Semente descendo */}
        <div
          className="absolute left-1/2 w-2.5 h-2.5 rounded-full bg-amber-700"
          style={{
            animation: 'treeSeedDrop 3s infinite ease-in-out',
          }}
        />

        {/* Broto emergindo */}
        <div
          className="absolute left-1/2 text-2xl"
          style={{
            animation: 'treeSproutGrow 3s infinite ease-in-out',
          }}
        >
          🌱
        </div>

        {/* Árvore florescendo */}
        <div
          className="absolute left-1/2 text-3xl"
          style={{
            animation: 'treeTreeSway 3s infinite ease-in-out',
          }}
        >
          🌳
        </div>
      </div>

      {label && (
        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 animate-pulse px-2">
          {label}
        </p>
      )}
    </div>
  );

  if (isOverlay) {
    return (
      <div className="fixed inset-0 bg-zinc-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop-in">
        <div className="bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-2xl max-w-xs w-full animate-scale-up">
          {content}
        </div>
      </div>
    );
  }

  // Modo Card comum (junto ao formulário ou área)
  return (
    <div className="border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 rounded-2xl p-4 w-full">
      {content}
    </div>
  );
}
