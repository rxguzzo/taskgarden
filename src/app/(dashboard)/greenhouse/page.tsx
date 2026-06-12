import React from 'react';
import { demoTasks } from '../../../mocks/demo-tasks';
import { Card } from '../../../components/ui/Card';
import { getStageLabel } from '../../../domain/growth/rules';

export default function GreenhousePage() {
  // Filtra as tarefas arquivadas (colhidas ou podadas)
  const archivedTasks = demoTasks.filter(
    task => task.status === 'COMPLETED' || task.status === 'PRUNED'
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                        {task.category}
                      </span>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">
                        {task.title}
                      </h3>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                      <span className="text-zinc-500 dark:text-zinc-400">Estágio Alcançado:</span>
                      <p className="font-bold text-zinc-700 dark:text-zinc-300">
                        {getStageLabel(task.stage)}
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Pontuação de Crescimento:</span>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">
                        {task.growthPoints} XP
                      </p>
                    </div>
                  </div>

                  {/* Motivo da poda se houver */}
                  {!isCompleted && task.pruneReason && (
                    <div className="mt-3 p-2.5 bg-red-500/5 rounded-xl border border-red-500/10 text-xs">
                      <span className="text-red-500 dark:text-red-400 font-semibold">Motivo da poda:</span>
                      <p className="text-zinc-600 dark:text-zinc-400 italic mt-0.5">
                        &quot;{task.pruneReason}&quot;
                      </p>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
                  <span className="text-[11px] text-zinc-400">
                    Arquivado em: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : 'Não definido'}
                  </span>
                  
                  {!isCompleted && (
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold rounded-xl text-xs hover:bg-emerald-100 transition-colors"
                      title="Restaurar semente ao Jardim ativo"
                    >
                      Restaurar Planta
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
