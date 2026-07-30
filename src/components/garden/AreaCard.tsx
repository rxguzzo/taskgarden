'use client';

import React, { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlantVisual } from '../plants/PlantVisual';
import { TreeLoading } from '../ui/TreeLoading';
import { formatFriendlyDate } from '../../utils/date';
import {
  getHealthStatusColorClass,
  getHealthStatusLabel,
  getStageLabel
} from '../../domain/growth/rules';
import { LifeAreaSummary } from '../../domain/growth/types';

interface AreaCardProps {
  area: LifeAreaSummary;
  timeLabel: string;
}

export function AreaCard({ area, timeLabel }: AreaCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavigate = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPending || isNavigating) return;

    setIsNavigating(true);
    startTransition(() => {
      router.push(`/garden/${area.id}`);
    });
  };

  const showLoading = isPending || isNavigating;

  const xpMin = area.prevStageXp;
  const xpMax = area.nextStageXp;
  const isMaxLevel = area.stage === 'MAJESTIC';
  const xpProgress = isMaxLevel ? 100 : Math.min(100, Math.max(0, Math.round(((area.xp - xpMin) / (xpMax - xpMin)) * 100)));

  return (
    <div
      onClick={handleNavigate}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (isPending || isNavigating) return;
          setIsNavigating(true);
          startTransition(() => {
            router.push(`/garden/${area.id}`);
          });
        }
      }}
      aria-label={`Ver detalhes da área ${area.name}`}
      className={`group flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-emerald-900/5 dark:border-white/5 shadow-sm shadow-emerald-950/5 hover:-translate-y-1 hover:shadow-md hover:shadow-emerald-950/10 hover:border-emerald-500/25 dark:hover:border-emerald-400/25 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none cursor-pointer relative overflow-hidden select-none ${showLoading ? 'opacity-70 pointer-events-none' : ''}`}
    >
      {/* Overlay de Loading imediato */}
      {showLoading && (
        <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/65 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center p-4">
          <TreeLoading label="Abrindo área..." size="sm" />
        </div>
      )}

      <div>
        {/* Nome da Área e Indicador de Saúde */}
        <div className="flex justify-between items-start gap-2">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {area.name}
            </h2>
            <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold mt-0.5">
              {getStageLabel(area.stage)}
            </p>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${getHealthStatusColorClass(area.healthStatus)}`}
          >
            {getHealthStatusLabel(area.healthStatus)}
          </span>
        </div>

        {/* Descrição Curta */}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-2 min-h-[2.25rem]">
          {area.description || 'Sem descrição cadastrada.'}
        </p>

        {/* Renderização da Árvore */}
        <div className="h-40 flex items-center justify-center bg-zinc-100/30 dark:bg-zinc-950/20 rounded-xl my-4 relative p-4 group-hover:bg-emerald-500/5 transition-colors">
          <PlantVisual stage={area.stage} visualSize={area.visualSize} healthStatus={area.healthStatus} animated />
        </div>

        {/* Progresso de Cultivo (XP) */}
        <div className="space-y-1.5 my-3">
          <div className="flex justify-between text-[10px] font-bold">
            <span className="text-zinc-400 dark:text-zinc-550 uppercase font-semibold">Progresso do Cultivo</span>
            <span className="text-emerald-600 dark:text-emerald-450">
              {isMaxLevel ? `${area.xp} XP` : `${area.xp} / ${xpMax} XP (${xpProgress}%)`}
            </span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Estatísticas e Atividade */}
      <div className="mt-2 pt-3 border-t border-zinc-100 dark:border-zinc-900 space-y-3">
        <div className="grid grid-cols-3 gap-1 text-[10px] bg-zinc-50/50 dark:bg-zinc-950/40 p-2 rounded-xl border border-zinc-100/50 dark:border-zinc-900/40 text-center">
          <div>
            <span className="text-zinc-400 block font-medium">Foco</span>
            <span className="font-bold text-zinc-700 dark:text-zinc-300">{timeLabel}</span>
          </div>
          <div>
            <span className="text-zinc-400 block font-medium">Sementes</span>
            <span className="font-bold text-zinc-700 dark:text-zinc-300">{area.completedTasksCount}</span>
          </div>
          <div>
            <span className="text-zinc-400 block font-medium">Recente</span>
            <span className="font-bold text-zinc-700 dark:text-zinc-300">{area.recentActionsCount}</span>
          </div>
        </div>

        {/* Última Atividade */}
        <div className="text-[9px] text-zinc-450 dark:text-zinc-550 flex justify-between items-center">
          <span>{area.activeTasksCount} tarefas ativas</span>
          <span>Atividade: {formatFriendlyDate(area.lastActivityAt)}</span>
        </div>
      </div>
    </div>
  );
}
