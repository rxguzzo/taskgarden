'use client';

import React from 'react';
import { demoAreaTasks } from '../../../mocks/demo-area-tasks';
import { demoLifeAreas } from '../../../mocks/demo-life-areas';
import { Card } from '../../../components/ui/Card';
import { formatFriendlyDate } from '../../../utils/date';

export default function GreenhousePage() {
  // Filtra as tarefas arquivadas (colhidas ou podadas)
  const archivedTasks = demoAreaTasks.filter(
    task => task.status === 'COMPLETED' || task.status === 'PRUNED'
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Estufa de Histórico</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">Exiba as plantas que foram colhidas ou podadas na sua jornada</p>
        </div>

        <div className="bg-amber-500/10 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-2xl border border-amber-500/20 text-xs max-w-sm">
          ⚠️ **Dados Demonstrativos**: Esta tela exibe dados de exemplo históricos da fundação estrutural do MVP.
        </div>
      </div>

      {archivedTasks.length === 0 ? (
        <Card variant="solid" className="text-center py-12">
          <p className="text-zinc-500 dark:text-zinc-400">Sua estufa está vazia. Comece a colher ou podar sementes no seu Jardim!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {archivedTasks.map(task => {
            const isCompleted = task.status === 'COMPLETED';

            // Localiza a área correspondente
            const area = demoLifeAreas.find(a => a.id === task.lifeAreaId);
            const areaName = area ? area.name : 'Sem Área';

            // Calcula XP aproximado gerado por esta tarefa concluída
            const xpEarned = isCompleted
              ? (task.difficulty === 'EASY' ? 120 : task.difficulty === 'MEDIUM' ? 150 : task.difficulty === 'HARD' ? 180 : 240)
              : 0;

            return (
              <Card
                key={task.id}
                variant="glass"
                className={`relative border-t-4 ${
                  isCompleted
                    ? 'border-t-emerald-500 border-emerald-500/10'
                    : 'border-t-red-500 border-red-500/10'
                } flex flex-col justify-between`}
              >
                <div>
                  {/* Cabeçalho */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
                        Área: {areaName}
                      </span>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">
                        {task.title}
                      </h3>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-800 dark:text-red-300 border border-red-500/20'
                      }`}
                    >
                      {isCompleted ? '✓ Colhida' : '✂ Podada'}
                    </span>
                  </div>

                  {/* Informações detalhadas */}
                  <div className="mt-4 grid grid-cols-2 gap-4 text-xs bg-zinc-100/50 dark:bg-zinc-950/20 p-3 rounded-xl">
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Dificuldade:</span>
                      <p className="font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">
                        {task.difficulty}
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">XP Adicionado à Área:</span>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        +{xpEarned} XP
                      </p>
                    </div>
                  </div>

                  {/* Motivo da poda se houver */}
                  {!isCompleted && task.pruneReason && (
                    <div className="mt-3 p-2.5 bg-red-500/5 rounded-xl border border-red-500/10 text-xs">
                      <span className="text-red-500 dark:text-red-400 font-semibold text-[10px]">Motivo da poda:</span>
                      <p className="text-zinc-600 dark:text-zinc-400 italic mt-0.5">
                        &quot;{task.pruneReason}&quot;
                      </p>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[11px] text-zinc-400">
                    Prazo: {formatFriendlyDate(task.dueDate)}
                  </span>
                  
                  {!isCompleted && (
                    <button
                      type="button"
                      disabled
                      className="px-3 py-1.5 bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600 font-semibold rounded-xl text-xs cursor-not-allowed text-center"
                      title="Restauração de tarefas estará disponível em breve com o banco de dados."
                    >
                      Restaurar Planta (Em breve)
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
