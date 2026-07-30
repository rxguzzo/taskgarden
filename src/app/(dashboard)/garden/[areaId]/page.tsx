import React, { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerClient } from '../../../../services/supabase/server';
import { Card } from '../../../../components/ui/Card';
import { PlantVisual } from '../../../../components/plants/PlantVisual';
import { formatFriendlyDate, getTodayDateOnly, getIsoWeekKey } from '../../../../utils/date';
import { AreaHeaderActions } from '../../../../components/garden/AreaHeaderActions';
import { AreaTasksList } from '../../../../components/garden/AreaTasksList';
import { AreaRoutinesList } from '../../../../components/garden/AreaRoutinesList';
import { BackButton } from '../../../../components/garden/BackButton';
import { 
  getStageLabel, 
  getVisualSizeLabel,
  getHealthStatusLabel,
  getHealthStatusColorClass,
  calculatePlantStage,
  calculatePlantVisualSize,
  calculateHealthStatus,
  getAreaProgress 
} from '../../../../domain/growth/rules';

export const revalidate = 0;

type AreaDetailPageProps = {
  params: Promise<{ areaId: string }>;
};

export default async function AreaDetailPage({ params }: AreaDetailPageProps) {
  const { areaId } = await params;
  
  const supabase = await getServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Localiza a área correspondente no banco
  const { data: area, error: areaError } = await supabase
    .from('life_areas')
    .select('*')
    .eq('id', areaId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();

  if (areaError || !area) {
    notFound();
  }

  // Buscar todas as áreas da vida do usuário (necessário para a edição de rotinas)
  const { data: lifeAreas, error: lifeAreasError } = await supabase
    .from('life_areas')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (lifeAreasError) {
    console.error('Erro ao buscar áreas da vida:', lifeAreasError);
  }


  // Filtra as tarefas associadas a esta área
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('life_area_id', area.id)
    .eq('user_id', user.id)
    .is('deleted_at', null);

  if (tasksError) {
    console.error('Erro ao buscar tarefas da área:', tasksError);
  }

  // Buscar subtarefas ativas desta área
  const { data: subtasks, error: subtasksError } = await supabase
    .from('subtasks')
    .select('*')
    .eq('life_area_id', area.id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (subtasksError) {
    console.error('Erro ao buscar subtarefas da área:', subtasksError);
  }

  const areaTasks = (tasks || []).map(t => ({
    ...t,
    subtasks: (subtasks || []).filter(s => s.task_id === t.id)
  }));
  const activeTasks = areaTasks.filter(t => t.status === 'ACTIVE');

  // Buscar sessões de trabalho associadas a esta área
  const { data: sessions, error: sessionsError } = await supabase
    .from('work_sessions')
    .select('*')
    .eq('life_area_id', area.id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('worked_at', { ascending: false });

  if (sessionsError) {
    console.error('Erro ao buscar sessões de trabalho da área:', sessionsError);
  }

  const areaSessions = sessions || [];

  // Buscar rotinas (habits) ativas vinculadas a esta área
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('*')
    .eq('life_area_id', area.id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (habitsError) {
    console.error('Erro ao buscar rotinas da área:', habitsError);
  }

  // Buscar as conclusões para os períodos correntes
  const todayStr = getTodayDateOnly();
  const currentWeekKey = getIsoWeekKey(todayStr);
  const currentMonthKey = todayStr.substring(0, 7);

  const { data: completions, error: completionsError } = await supabase
    .from('habit_completions')
    .select('*')
    .eq('user_id', user.id)
    .or(`and(period_type.eq.DAY,period_key.eq.${todayStr}),and(period_type.eq.WEEK,period_key.eq.${currentWeekKey}),and(period_type.eq.MONTH,period_key.eq.${currentMonthKey})`);

  if (completionsError) {
    console.error('Erro ao buscar conclusões das rotinas da área:', completionsError);
  }


  // Deriva dados dinamicamente usando as regras de crescimento reais
  const activeCount = activeTasks.length;

  // M3: Esforço real por work_sessions.duration_minutes
  const totalMinutes = areaSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const stage = calculatePlantStage(totalMinutes);
  const visualSize = calculatePlantVisualSize(stage, totalMinutes);
  const healthStatus = calculateHealthStatus(activeCount);
  const currentProgress = getAreaProgress(areaTasks, area.id);
  
  const hoursDedicated = Math.round(totalMinutes / 60);

  // Calcular última atividade (incluindo as sessões)
  const dates = [new Date(area.updated_at).getTime()];
  areaTasks.forEach((t) => {
    dates.push(new Date(t.updated_at).getTime());
  });
  areaSessions.forEach((s) => {
    dates.push(new Date(s.updated_at).getTime());
  });
  const maxTime = Math.max(...dates);
  const lastActivityAt = new Date(maxTime).toISOString();

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Barra de Navegação Superior / Voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-6">
        <div className="flex items-center space-x-3">
          <BackButton />
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">Área da Vida</span>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{area.name}</h1>
          </div>
        </div>

        {/* Ações da Área (Plantar, Editar, Arquivar) */}
        <Suspense fallback={<div className="h-10 w-24 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-xl" />}>
          <AreaHeaderActions area={area} />
        </Suspense>
      </div>

      {/* Grid de Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Lado Esquerdo: Resumo do Cultivo e Visualização da Árvore */}
        <div className="lg:col-span-4 space-y-6">
          <Card variant="glass" className="text-center p-6 space-y-6">
            <h2 className="text-lg font-bold text-zinc-800 dark:text-white border-b border-zinc-100 dark:border-zinc-900 pb-3">
              Árvore de Cultivo
            </h2>
            
            {/* Visual da Árvore */}
            <div className="h-56 flex items-center justify-center bg-zinc-100/30 dark:bg-zinc-950/20 rounded-2xl relative p-6">
              <PlantVisual stage={stage} visualSize={visualSize} animated />
            </div>

            {/* Painel Estatístico Acumulado */}
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-900/50 pb-2">
                <span className="text-zinc-500 dark:text-zinc-400">Estágio:</span>
                <span className="font-bold text-zinc-800 dark:text-white">{getStageLabel(stage)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-900/50 pb-2">
                <span className="text-zinc-500 dark:text-zinc-400">Tamanho:</span>
                <span className="font-bold text-zinc-800 dark:text-white">{getVisualSizeLabel(visualSize)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-900/50 pb-2">
                <span className="text-zinc-500 dark:text-zinc-400">Frequência/Saúde:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getHealthStatusColorClass(healthStatus)}`}>
                  {getHealthStatusLabel(healthStatus)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-900/50 pb-2">
                <span className="text-zinc-500 dark:text-zinc-400">Esforço Total:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {hoursDedicated > 0 ? `${hoursDedicated} ${hoursDedicated === 1 ? 'hora' : 'horas'}` : `${totalMinutes} min`}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm pb-1">
                <span className="text-zinc-500 dark:text-zinc-400">Última Atividade:</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{formatFriendlyDate(lastActivityAt)}</span>
              </div>
            </div>

            {/* Barra de Progresso Atual da Área */}
            <div className="border-t border-zinc-100 dark:border-zinc-900 pt-4 text-left space-y-2">
              {currentProgress !== null ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span>Progresso das Tarefas Atuais</span>
                    <span>{currentProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-50 h-full rounded-full transition-all duration-500"
                      style={{ width: `${currentProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-xs text-center font-semibold text-zinc-400 dark:text-zinc-500 bg-zinc-100/40 dark:bg-zinc-950/20 py-2 rounded-lg border border-dashed border-zinc-200/55 dark:border-zinc-800/55">
                  📭 Sem tarefas ativas no momento
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Lado Direito: Listagem de Tarefas e Rotinas */}
        <div className="lg:col-span-8 min-w-0 w-full space-y-6">
          <AreaTasksList tasks={areaTasks} sessions={areaSessions} area={area} />

          <AreaRoutinesList habits={habits || []} completions={completions || []} lifeAreas={lifeAreas || []} />
        </div>
      </div>
    </div>
  );
}
