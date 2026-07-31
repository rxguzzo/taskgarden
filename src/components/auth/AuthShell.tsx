import React from 'react';
import { AuthIllustration } from './AuthIllustration';
import { FallingLeaves } from './FallingLeaves';

type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen bg-stone-50/50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      {/* Background Falling Leaves animation */}
      <FallingLeaves />

      {/* Main card box grid container */}
      <div className="w-full max-w-5xl bg-white/70 dark:bg-zinc-900/75 backdrop-blur-md border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px] relative z-10">
        
        {/* Left Column: Visual Illustration (lg only) */}
        <div className="hidden lg:flex lg:col-span-6 border-r border-zinc-200/30 dark:border-zinc-800/30 flex-col relative">
          <AuthIllustration />
        </div>

        {/* Right Column: Form content */}
        <div className="col-span-1 lg:col-span-6 flex flex-col justify-center p-6 sm:p-10 lg:p-12 relative z-10">
          
          {/* Header containing Logo and subtitles (centered) */}
          <div className="flex flex-col items-center mb-6 text-center select-none">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              TaskGarden
            </h2>
            
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-455 mt-1.5 uppercase tracking-wider">
              SEU JARDIM DE PRODUTIVIDADE.
            </p>
            
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">
              Planeje, cultive e colha resultados.
            </p>

            {/* Separator leaf line */}
            <div className="flex items-center gap-2 w-full mt-5">
              <div className="h-px bg-zinc-200/60 dark:bg-zinc-800/60 flex-1" />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-550 shrink-0">
                <path d="M2 22C6 18 12 17 17 12C22 7 21 2 21 2C21 2 16 3 11 8C6 13 5 19 2 22Z" />
              </svg>
              <div className="h-px bg-zinc-200/60 dark:bg-zinc-800/60 flex-1" />
            </div>
          </div>

          <div className="w-full max-w-sm mx-auto">
            {children}
          </div>
        </div>
      </div>

      {/* Feature Highlights beneath the container (lg only) */}
      <div className="hidden lg:grid grid-cols-3 gap-8 w-full max-w-5xl mt-10 relative z-10 px-4 select-none">
        
        {/* Highlight 1: Security */}
        <div className="flex items-start gap-3.5">
          <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/10 text-emerald-700 dark:text-emerald-400 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Seguro e confiável</h4>
            <p className="text-[11px] text-zinc-550 dark:text-zinc-400 mt-0.5 leading-relaxed">
              Seus dados protegidos com autenticação segura e acesso privado.
            </p>
          </div>
        </div>

        {/* Highlight 2: Growth */}
        <div className="flex items-start gap-3.5">
          <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/10 text-emerald-700 dark:text-emerald-400 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1A3.75 3.75 0 0 0 12 18Z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Feito para crescer</h4>
            <p className="text-[11px] text-zinc-550 dark:text-zinc-400 mt-0.5 leading-relaxed">
              Ferramentas inteligentes de plantio e cultivo para multiplicar seus resultados.
            </p>
          </div>
        </div>

        {/* Highlight 3: Speed */}
        <div className="flex items-start gap-3.5">
          <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/10 text-emerald-700 dark:text-emerald-400 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Ganha tempo</h4>
            <p className="text-[11px] text-zinc-550 dark:text-zinc-400 mt-0.5 leading-relaxed">
              Automatize rotinas e compromissos para focar no cultivo do que realmente importa.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
