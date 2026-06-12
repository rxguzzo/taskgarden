import React from 'react';
import { demoTasks } from '../../../mocks/demo-tasks';
import { Card } from '../../../components/ui/Card';
import { PlantVisual } from '../../../components/plants/PlantVisual';
import { getStageLabel } from '../../../domain/growth/rules';

export default function GardenPage() {
  // Filtra apenas as tarefas ativas para exibição no jardim
  const activeTasks = demoTasks.filter(task => task.status === 'ACTIVE');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cabeçalho de Boas-Vindas */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Meu Jardim</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">Veja e cuide das suas tarefas em crescimento</p>
        </div>
        
        {/* Banner de Dados Demonstrativos */}
        <div className="bg-amber-500/10 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-2xl border border-amber-500/20 text-xs max-w-sm">
          ⚠️ **Dados Demonstrativos**: Esta tela exibe dados de exemplo da fundação estrutural do MVP para ilustrar o visual do Jardim.
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="glass" className="p-4 flex flex-col justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Sementes Ativas</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {activeTasks.length}
          </span>
        </Card>
        <Card variant="glass" className="p-4 flex flex-col justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Tempo Focado (Hoje)</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            1h 45m
          </span>
        </Card>
        <Card variant="glass" className="p-4 flex flex-col justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Sequência de Dias</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            5 dias 🔥
          </span>
        </Card>
        <Card variant="glass" className="p-4 flex flex-col justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Estágio Dominante</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            Árvore 🌳
          </span>
        </Card>
      </div>

      {/* Grade de Plantas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTasks.map((task) => (
          <Card
            key={task.id}
            variant="glass"
            className="relative overflow-hidden group hover:border-emerald-500/30 dark:hover:border-emerald-400/30 hover:shadow-md hover:shadow-emerald-950/5 transition-all duration-300 flex flex-col"
          >
            {/* Indicadores de Estado Superior Direito */}
            <div className="absolute top-4 right-4 flex space-x-1.5 z-10">
              {task.isThirsty && (
                <span
                  className="bg-sky-500/10 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-sky-500/20 flex items-center gap-1"
                  title="Esta planta está há alguns dias sem atualizações"
                >
                  💧 Com Sede
                </span>
              )}
              {task.isDelayed && (
                <span
                  className="bg-red-500/10 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-500/20 flex items-center gap-1"
                  title="O prazo estipulado desta tarefa já expirou"
                >
                  ⚠️ Atrasada
                </span>
              )}
            </div>

            {/* Renderização Visual da Planta */}
            <div className="h-44 flex items-center justify-center bg-zinc-100/30 dark:bg-zinc-950/20 rounded-xl mb-4 relative p-4">
              <PlantVisual stage={task.stage} visualSize={task.visualSize} animated />
            </div>

            {/* Informações da Tarefa */}
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
                  {task.category}
                </span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white line-clamp-1 mt-0.5">
                  {task.title}
                </h3>
              </div>

              {/* Barra de Progresso e Métricas */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Estágio: <strong>{getStageLabel(task.stage)}</strong>
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {task.progress}%
                  </span>
                </div>
                
                {/* Linha da Barra */}
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
                  <span>Pontos: <strong>{task.growthPoints} XP</strong></span>
                  {task.dueDate && (
                    <span>Prazo: <strong>{new Date(task.dueDate).toLocaleDateString('pt-BR')}</strong></span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
