import React from 'react';
import Image from 'next/image';

export function AuthIllustration() {
  return (
    <div className="w-full h-full flex flex-col justify-between p-10 relative overflow-hidden select-none bg-[#f7f7f0] dark:bg-[#1a1b18] z-10">
      
      {/* Top Capsule label: CULTIVANDO FOCO */}
      <div className="z-20 flex items-center">
        <div className="flex items-center gap-1.5 bg-[#e4ebdf] dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-450 px-3.5 py-1.5 rounded-full border border-emerald-500/10 text-[10px] font-black uppercase tracking-wider">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
            <path d="M2 22C6 18 12 17 17 12C22 7 21 2 21 2C21 2 16 3 11 8C6 13 5 19 2 22Z" />
          </svg>
          Cultivando Foco
        </div>
      </div>

      {/* Central Illustration: Clean majestic tree image asset without any embedded text */}
      <div className="z-10 flex-1 flex items-center justify-center py-4 relative min-h-[300px]">
        <div className="relative w-full aspect-square max-w-[340px] overflow-hidden rounded-[2rem] bg-transparent">
          <Image
            src="/brand/taskgarden-auth-tree.png"
            alt="Árvore do jardim TaskGarden"
            fill
            sizes="340px"
            priority
            className="object-cover select-none pointer-events-none"
          />
        </div>
      </div>

      {/* Bottom info: Leaf Sprout and Text */}
      <div className="z-20 space-y-3 max-w-md w-full">
        <div className="flex items-center gap-2">
          <div className="bg-[#e4ebdf] dark:bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-500/10 text-emerald-800 dark:text-emerald-450 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1A3.75 3.75 0 0 0 12 18Z" />
            </svg>
          </div>
          
          <h3 className="text-[#0b4d2c] dark:text-[#86efac] font-black text-[15px] sm:text-base tracking-tight leading-none">
            Organize hoje, colha amanhã.
          </h3>
        </div>
        
        <p className="text-[#5b6957] dark:text-zinc-400 text-xs sm:text-sm font-semibold leading-relaxed pl-8">
          Planeje seu jardim de sementes e colha grandes resultados de foco e produtividade.
        </p>
      </div>
    </div>
  );
}
