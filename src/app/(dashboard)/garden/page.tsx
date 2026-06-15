'use client';

import React from 'react';
import Link from 'next/link';
import { demoLifeAreas } from '../../../mocks/demo-life-areas';
import { demoAreaTasks } from '../../../mocks/demo-area-tasks';
import { PlantVisual } from '../../../components/plants/PlantVisual';
import { formatFriendlyDate } from '../../../utils/date';
import {
  getVisualSizeLabel,
  getHealthStatusLabel,
  getHealthStatusColorClass,
  getAreaActiveTasksCount,
  getAreaCompletedTasksCount,
  getAreaProgress
} from '../../../domain/growth/rules';

export default function GardenPage() {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Cabeçalho da Tela */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Meu Jardim</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">Cultive cada área importante da sua vida.</p>
        </div>
        
        {/* Ação Principal Desabilitada com Marcador Provisório */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled
            className="px-5 py-2.5 bg-emerald-600/50 text-white font-semibold rounded-xl text-sm cursor-not-allowed flex items-center gap-1.5 shadow-sm"
            title="Funcionalidade de criação de novas áreas estará disponível em breve no módulo de banco de dados."
          >
            <span>+ Nova área</span>
            <span className="text-[10px] bg-emerald-700/60 px-1.5 py-0.5 rounded text-emerald-200">Em breve</span>
          </button>
        </div>
      </div>

      {/* Banner de Dados Demonstrativos */}
      <div className="bg-amber-500/10 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 p-4 rounded-2xl border border-amber-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          ⚠️ **Dados Demonstrativos**: Esta tela exibe dados de exemplo de áreas de vida e tarefas fictícias.
        </div>
        <div className="font-semibold underline">
          Modo Leitura
        </div>
      </div>

      {/* Grade de Árvores de Áreas da Vida */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {demoLifeAreas.map((area) => {
          // Deriva estatísticas das tarefas de forma dinâmica
          const activeCount = getAreaActiveTasksCount(demoAreaTasks, area.id);
          const completedCount = getAreaCompletedTasksCount(demoAreaTasks, area.id);
          const currentProgress = getAreaProgress(demoAreaTasks, area.id);

          const hoursDedicated = Math.round(area.totalMinutes / 60);

          return (
            <Link
              key={area.id}
              href={`/garden/${area.id}`}
              className="group flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-emerald-900/5 dark:border-white/5 shadow-sm shadow-emerald-950/5 hover:-translate-y-1 hover:shadow-md hover:shadow-emerald-950/10 hover:border-emerald-500/25 dark:hover:border-emerald-400/25 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none cursor-pointer"
            >
              <div>
                {/* Nome da Área e Indicador de Saúde */}
                <div className="flex justify-between items-start gap-2">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {area.name}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getHealthStatusColorClass(area.healthStatus)}`}
                  >
                    {getHealthStatusLabel(area.healthStatus)}
                  </span>
                </div>

                {/* Descrição Curta */}
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 min-h-[2rem]">
                  {area.description}
                </p>

                {/* Renderização da Árvore */}
                <div className="h-40 flex items-center justify-center bg-zinc-100/30 dark:bg-zinc-950/20 rounded-xl my-4 relative p-4 group-hover:bg-emerald-500/5 transition-colors">
                  <PlantVisual stage={area.stage} visualSize={area.visualSize} animated />
                </div>

                {/* Dados Acumulados Históricos */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-100/50 dark:bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-100/50 dark:border-zinc-900/50">
                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-semibold">Tempo</span>
                    <p className="font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">{hoursDedicated}h dedicadas</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-semibold">Tamanho</span>
                    <p className="font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">{getVisualSizeLabel(area.visualSize)}</p>
                  </div>
                </div>
              </div>

              {/* Estatísticas de Tarefas */}
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900 space-y-3">
                <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>Ativas: <strong>{activeCount}</strong></span>
                  <span>Concluídas: <strong>{completedCount}</strong></span>
                </div>

                {/* Barra de Progresso ou Mensagem "Sem tarefas ativas" */}
                {currentProgress !== null ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span>Progresso Atual</span>
                      <span>{currentProgress}%</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${currentProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-center font-semibold text-zinc-400 dark:text-zinc-500 bg-zinc-100/40 dark:bg-zinc-950/20 py-1.5 rounded-lg border border-dashed border-zinc-200/55 dark:border-zinc-800/55">
                    📭 Sem tarefas ativas
                  </div>
                )}

                {/* Última Atividade */}
                <div className="text-[10px] text-right text-zinc-400 mt-1">
                  Atividade em: {formatFriendlyDate(area.lastActivityAt)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
