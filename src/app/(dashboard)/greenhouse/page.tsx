import React from 'react';
import { redirect } from 'next/navigation';
import { getServerClient } from '../../../services/supabase/server';
import { Card } from '../../../components/ui/Card';
import { formatFriendlyDate } from '../../../utils/date';

export const revalidate = 0;

export default async function GreenhousePage() {
  const supabase = await getServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Buscar todas as tarefas arquivadas (concluídas ou podadas)
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['COMPLETED', 'PRUNED'])
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (tasksError) {
    console.error('Erro ao carregar estufa de histórico:', tasksError);
  }

  // Buscar áreas para mostrar os nomes
  const { data: areas, error: areasError } = await supabase
    .from('life_areas')
    .select('id, name')
    .eq('user_id', user.id);

  if (areasError) {
    console.error('Erro ao buscar áreas de vida para a estufa:', areasError);
  }

  // Buscar todas as sessões de trabalho ativas do usuário para computar tempos reais
  const { data: workSessions, error: sessionsError } = await supabase
    .from('work_sessions')
    .select('task_id, duration_minutes')
    .eq('user_id', user.id)
    .is('deleted_at', null);

  if (sessionsError) {
    console.error('Erro ao buscar sessões de trabalho para estufa:', sessionsError);
  }

  // Mapeia minutos por tarefa
  const minutesByTask = new Map<string, number>();
  (workSessions || []).forEach((s) => {
    const prev = minutesByTask.get(s.task_id) || 0;
    minutesByTask.set(s.task_id, prev + s.duration_minutes);
  });

  const areaMap = new Map((areas || []).map((a) => [a.id, a.name]));
  const archivedTasks = tasks || [];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Estufa de Histórico</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">Exiba as plantas que foram colhidas ou podadas na sua jornada</p>
        </div>
      </div>

      {archivedTasks.length === 0 ? (
        <Card variant="solid" className="text-center py-12">
          <p className="text-zinc-500 dark:text-zinc-400">Sua estufa está vazia. Comece a colher ou podar sementes no seu Jardim!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {archivedTasks.map((task) => {
            const isCompleted = task.status === 'COMPLETED';
            const areaName = areaMap.get(task.life_area_id) || 'Área Arquivada/Desconhecida';

            // Computa tempo dedicado real
            const totalMinutes = minutesByTask.get(task.id) || 0;
            const hoursDedicated = Math.floor(totalMinutes / 60);
            const remainingMins = totalMinutes % 60;
            const timeLabel = hoursDedicated > 0 ? `${hoursDedicated}h ${remainingMins}m` : `${remainingMins} min`;

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
                      <span className="text-zinc-500 dark:text-zinc-400">Dificuldade / Prioridade:</span>
                      <p className="font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">
                        {task.difficulty} / {task.priority}
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Tempo Real Dedicado:</span>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {timeLabel}
                      </p>
                    </div>
                  </div>

                  {/* Motivo da poda se houver */}
                  {!isCompleted && task.prune_reason && (
                    <div className="mt-3 p-2.5 bg-red-500/5 rounded-xl border border-red-500/10 text-xs">
                      <span className="text-red-500 dark:text-red-400 font-semibold text-[10px]">Motivo da poda:</span>
                      <p className="text-zinc-600 dark:text-zinc-400 italic mt-0.5">
                        &quot;{task.prune_reason}&quot;
                      </p>
                    </div>
                  )}
                </div>

                {/* Datas */}
                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[11px] text-zinc-450">
                    Prazo: {formatFriendlyDate(task.due_date)}
                  </span>
                  {isCompleted && task.completed_at && (
                    <span className="text-[11px] text-zinc-450">
                      Colhida em: {formatFriendlyDate(task.completed_at)}
                    </span>
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
