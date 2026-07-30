import React from 'react';
import { redirect } from 'next/navigation';
import { getServerClient } from '../../../services/supabase/server';
import { CreateAreaDialog } from '../../../components/garden/CreateAreaDialog';
import { AreaCard } from '../../../components/garden/AreaCard';
import {
  calculatePlantStage,
  calculatePlantVisualSize,
  calculateHealthStatus,
  getAreaProgress,
  calculateAreaXp,
  calculateRecentActivityScore,
  getStageXpBounds
} from '../../../domain/growth/rules';
import { LifeAreaSummary } from '../../../domain/growth/types';

export const revalidate = 0;

export default async function GardenPage() {
  const supabase = await getServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Buscar áreas de vida ativas do usuário
  const { data: areas, error: areasError } = await supabase
    .from('life_areas')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (areasError) {
    console.error('Erro ao buscar áreas de vida:', areasError);
  }

  // Buscar todas as tarefas do usuário (não deletadas)
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null);

  if (tasksError) {
    console.error('Erro ao buscar tarefas:', tasksError);
  }

  // Buscar todas as subtarefas ativas do usuário
  const { data: subtasks, error: subtasksError } = await supabase
    .from('subtasks')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null);

  if (subtasksError) {
    console.error('Erro ao buscar subtarefas:', subtasksError);
  }

  // Buscar todas as sessões de trabalho ativas do usuário
  const { data: workSessions, error: sessionsError } = await supabase
    .from('work_sessions')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null);

  if (sessionsError) {
    console.error('Erro ao buscar sessões de trabalho:', sessionsError);
  }

  // Buscar todas as rotinas (habits) ativas do usuário
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null);

  if (habitsError) {
    console.error('Erro ao buscar rotinas:', habitsError);
  }

  // Buscar todas as conclusões de rotina (habit_completions) do usuário
  const { data: habitCompletions, error: completionsError } = await supabase
    .from('habit_completions')
    .select('*')
    .eq('user_id', user.id);

  if (completionsError) {
    console.error('Erro ao buscar conclusões de rotinas:', completionsError);
  }

  const allSessions = workSessions || [];

  // Mapear áreas para summaries reais
  const summaries: LifeAreaSummary[] = (areas || []).map((area) => {
    // Anexa as subtarefas correspondentes a cada tarefa
    const areaTasks = (tasks || []).map(t => ({
      ...t,
      subtasks: (subtasks || []).filter(s => s.task_id === t.id)
    })).filter((t) => t.life_area_id === area.id);
    const areaSessions = allSessions.filter((s) => s.life_area_id === area.id);

    const activeTasks = areaTasks.filter((t) => t.status === 'ACTIVE');
    const completedTasks = areaTasks.filter((t) => t.status === 'COMPLETED');
    const prunedTasks = areaTasks.filter((t) => t.status === 'PRUNED');

    const activeTasksCount = activeTasks.length;
    const completedTasksCount = completedTasks.length;
    const prunedTasksCount = prunedTasks.length;

    // Obter hábitos e subtarefas para esta área
    const areaHabits = (habits || []).filter((h) => h.life_area_id === area.id);
    const areaCompletions = (habitCompletions || []).filter((c) =>
      areaHabits.some((h) => h.id === c.habit_id)
    );
    const habitCompletionsCount = areaCompletions.length;

    const areaSubtasks = (subtasks || []).filter((s) => s.life_area_id === area.id);
    const completedSubtasksCount = areaSubtasks.filter((s) => s.is_completed).length;

    // M3: Soma de minutos reais das sessões daquela área
    const totalMinutes = areaSessions.reduce((sum, s) => sum + s.duration_minutes, 0);

    // M11: Cálculo de XP e Estágio da Árvore
    const xp = calculateAreaXp(
      completedTasksCount,
      completedSubtasksCount,
      totalMinutes,
      habitCompletionsCount
    );

    const stage = calculatePlantStage(xp);
    const visualSize = calculatePlantVisualSize(stage);
    const { prev: prevStageXp, next: nextStageXp } = getStageXpBounds(stage);

    // M11: Consistência de Atividade Recente (SAT) e Saúde da Árvore
    const { sat, recentActionsCount } = calculateRecentActivityScore(
      areaTasks,
      areaSubtasks,
      areaSessions,
      areaCompletions
    );

    const healthStatus = calculateHealthStatus(sat);
    const currentProgress = getAreaProgress(areaTasks, area.id);

    // Calcular data da última atividade (incluindo as sessões)
    const dates = [new Date(area.updated_at).getTime()];
    areaTasks.forEach((t) => {
      dates.push(new Date(t.updated_at).getTime());
    });
    areaSessions.forEach((s) => {
      dates.push(new Date(s.updated_at).getTime());
    });
    const maxTime = Math.max(...dates);
    const lastActivityAt = new Date(maxTime).toISOString();

    return {
      ...area,
      stage,
      visualSize,
      totalMinutes,
      healthStatus,
      currentProgress,
      activeTasksCount,
      completedTasksCount,
      prunedTasksCount,
      lastActivityAt,
      xp,
      nextStageXp,
      prevStageXp,
      recentActionsCount,
    };
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Cabeçalho da Tela */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Meu Jardim</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">Cultive cada área importante da sua vida.</p>
        </div>
        
        {/* Ação Principal: Criar Área de Vida */}
        <div className="flex items-center gap-3">
          <CreateAreaDialog />
        </div>
      </div>

      {/* Grade de Árvores de Áreas da Vida */}
      {summaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm max-w-xl mx-auto">
          <div className="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 text-2xl">
            🌱
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Seu jardim está vazio</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm">
            Plantando sua primeira área da vida, uma semente de árvore surgirá no seu jardim para representar seus objetivos.
          </p>
          <div className="mt-6">
            <CreateAreaDialog
              trigger={
                <button
                  type="button"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  aria-label="Plantar Primeira Área da Vida"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>Plantar Primeira Área</span>
                </button>
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {summaries.map((area) => {
            const hoursDedicated = Math.floor(area.totalMinutes / 60);
            const remainingMins = area.totalMinutes % 60;
            const timeLabel = hoursDedicated > 0 ? `${hoursDedicated}h ${remainingMins}m` : `${remainingMins}m`;

            return (
              <AreaCard
                key={area.id}
                area={area}
                timeLabel={timeLabel}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
