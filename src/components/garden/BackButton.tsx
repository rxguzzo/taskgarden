'use client';

import React, { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TreeLoading } from '../ui/TreeLoading';

export function BackButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPending || isNavigating) return;

    setIsNavigating(true);
    startTransition(() => {
      router.push('/garden');
    });
  };

  const showLoading = isPending || isNavigating;

  return (
    <button
      onClick={handleBack}
      disabled={showLoading}
      className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-w-[38px] min-h-[38px]"
      title="Voltar ao Jardim"
    >
      {showLoading ? (
        <TreeLoading size="sm" />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
      )}
    </button>
  );
}
