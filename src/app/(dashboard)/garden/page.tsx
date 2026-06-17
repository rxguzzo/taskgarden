import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerClient } from '../../../services/supabase/server';
import { PlantVisual } from '../../../components/plants/PlantVisual';
import { formatFriendlyDate } from '../../../utils/date';
import { CreateAreaDialog } from '../../../components/garden/CreateAreaDialog';
import {
  getVisualSizeLabel,
  getHealthStatusLabel,
  getHealthStatusColorClass,
  calculatePlantStage,
  calculatePlantVisualSize,
  calculateHealthStatus,
  getAreaProgress
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

    // M3: Soma de minutos reais das sessões daquela área
    const totalMinutes = areaSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
    const stage = calculatePlantStage(totalMinutes);
    const visualSize = calculatePlantVisualSize(stage, totalMinutes);
    const healthStatus = calculateHealthStatus(activeTasksCount);
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
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {summaries.map((area) => {
            const hoursDedicated = Math.floor(area.totalMinutes / 60);
            const remainingMins = area.totalMinutes % 60;
            const timeLabel = hoursDedicated > 0 ? `${hoursDedicated}h ${remainingMins}m` : `${remainingMins}m`;

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
                    {area.description || 'Sem descrição cadastrada.'}
                  </p>

                  {/* Renderização da Árvore */}
                  <div className="h-40 flex items-center justify-center bg-zinc-100/30 dark:bg-zinc-950/20 rounded-xl my-4 relative p-4 group-hover:bg-emerald-500/5 transition-colors">
                    <PlantVisual stage={area.stage} visualSize={area.visualSize} animated />
                  </div>

                  {/* Dados Acumulados Históricos */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-100/50 dark:bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-100/50 dark:border-zinc-900/50">
                    <div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-550 uppercase font-semibold">Tempo Real</span>
                      <p className="font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">{timeLabel}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-550 uppercase font-semibold">Tamanho</span>
                      <p className="font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">{getVisualSizeLabel(area.visualSize)}</p>
                    </div>
                  </div>
                </div>

                {/* Estatísticas de Tarefas */}
                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900 space-y-3">
                  <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span>Ativas: <strong>{area.activeTasksCount}</strong></span>
                    <span>Concluídas: <strong>{area.completedTasksCount}</strong></span>
                  </div>

                  {/* Barra de Progresso ou Mensagem "Sem tarefas ativas" */}
                  {area.currentProgress !== null ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span>Progresso Atual</span>
                        <span>{area.currentProgress}%</span>
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-50 h-full rounded-full transition-all duration-500"
                          style={{ width: `${area.currentProgress}%` }}
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
      )}
    </div>
  );
}
