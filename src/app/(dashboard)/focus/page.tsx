'use client';

import { Card } from '../../../components/ui/Card';
import { demoAreaTasks } from '../../../mocks/demo-area-tasks';
import { demoLifeAreas } from '../../../mocks/demo-life-areas';

export default function FocusPage() {
  const activeTasks = demoAreaTasks.filter(t => t.status === 'ACTIVE');

  return (
    <div className="space-y-8 max-w-2xl mx-auto text-center animate-fade-in">
      <div className="text-left">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Sessão de Foco (Regar)</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">Dedique tempo focado e faça sua planta crescer em tempo real</p>
      </div>

      <Card variant="glass" className="space-y-8 py-10">
        <div className="bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl text-xs text-left border border-emerald-500/20 max-w-md mx-auto">
          ⏱️ **Nota do MVP**: O cronômetro de foco nesta etapa inicial é uma interface visual da fundação. O salvamento e a recuperação persistente após atualizar a página serão implementados com o motor de crescimento do backend.
        </div>

        {/* Selecionador de Sementes */}
        <div className="max-w-md mx-auto space-y-2 text-left">
          <label htmlFor="task-select" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Selecionar Planta para Regar:
          </label>
          <select
            id="task-select"
            defaultValue={activeTasks[0]?.id || ''}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
          >
            {activeTasks.map(task => {
              const area = demoLifeAreas.find(a => a.id === task.lifeAreaId);
              const areaName = area ? area.name : 'Geral';
              return (
                <option key={task.id} value={task.id}>
                  🌱 {task.title} ({areaName})
                </option>
              );
            })}
          </select>
        </div>

        {/* Visual do Cronômetro Circular */}
        <div className="relative w-60 h-60 mx-auto flex flex-col items-center justify-center bg-zinc-100/30 dark:bg-zinc-950/30 rounded-full border-4 border-emerald-500/20 shadow-inner">
          <span className="text-5xl font-mono font-bold text-zinc-800 dark:text-white">25:00</span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-widest mt-2">
            Modo Foco
          </span>
          <span className="text-[10px] text-zinc-400 mt-1">1 min = 1 ponto</span>
        </div>

        {/* Controles */}
        <div className="flex justify-center gap-4">
          <button
            type="button"
            className="w-12 h-12 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full transition-colors"
            title="Reiniciar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
          
          <button
            type="button"
            className="w-16 h-16 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-emerald-900/20 transition-all transform hover:scale-105"
            title="Iniciar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 ml-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 0 1 0 1.971l-11.54 6.347a1.125 1.125 0 0 1-1.667-.985V5.653Z" />
            </svg>
          </button>

          <button
            type="button"
            className="w-12 h-12 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full transition-colors"
            title="Concluir Antecipado"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </button>
        </div>

        {/* Observações da Sessão */}
        <div className="max-w-md mx-auto text-left space-y-2">
          <label htmlFor="focus-note" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            O que foi realizado nesta sessão? (Observação)
          </label>
          <input
            id="focus-note"
            type="text"
            placeholder="Ex: Escrevi os primeiros parágrafos do relatório"
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </Card>
    </div>
  );
}
