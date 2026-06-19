import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerClient } from '../../../services/supabase/server';
import { Card } from '../../../components/ui/Card';
import { formatFriendlyDate } from '../../../utils/date';

export const revalidate = 0;

export default async function StatisticsPage() {
  const supabase = await getServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Buscar todas as áreas
  const { data: areas, error: areasError } = await supabase
    .from('life_areas')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null);

  if (areasError) {
    console.error('Erro ao buscar áreas de vida para estatísticas:', areasError);
  }

  // Buscar todas as tarefas
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null);

  if (tasksError) {
    console.error('Erro ao buscar tarefas para estatísticas:', tasksError);
  }

  // Buscar todas as sessões de trabalho do usuário
  const { data: workSessions, error: sessionsError } = await supabase
    .from('work_sessions')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('worked_at', { ascending: false });

  if (sessionsError) {
    console.error('Erro ao buscar sessões de trabalho para estatísticas:', sessionsError);
  }

  // Buscar todas as subtarefas do usuário
  const { data: subtasks, error: subtasksError } = await supabase
    .from('subtasks')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null);

  if (subtasksError) {
    console.error('Erro ao buscar subtarefas para estatísticas:', subtasksError);
  }

  const activeAreas = areas || [];
  const allTasks = tasks || [];
  const allSessions = workSessions || [];
  const allSubtasks = subtasks || [];

  const totalAreasActivas = activeAreas.length;
  const totalTasksActivas = allTasks.filter((t) => t.status === 'ACTIVE').length;
  const totalTasksConcluidas = allTasks.filter((t) => t.status === 'COMPLETED').length;
  const totalTasksPodadas = allTasks.filter((t) => t.status === 'PRUNED').length;
  const totalTasksHistoricas = totalTasksConcluidas + totalTasksPodadas;

  // M3: Esforço real baseado na soma das sessões de trabalho
  const totalMinutes = allSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const formattedHours = hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;

  // Taxa de colheita: concluídas / (concluídas + podadas)
  const taxaDeColheita = totalTasksHistoricas > 0
    ? Math.round((totalTasksConcluidas / totalTasksHistoricas) * 100)
    : 0;

  // Estatísticas de Subtarefas
  const totalSubtasks = allSubtasks.length;
  const completedSubtasks = allSubtasks.filter(s => s.is_completed).length;
  const subtaskCompletionRate = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Estatísticas e dedicação por Área de Vida
  const areaStats = activeAreas.map((area) => {
    const areaTasks = allTasks.filter((t) => t.life_area_id === area.id);
    const areaSessions = allSessions.filter((s) => s.life_area_id === area.id);
    const active = areaTasks.filter((t) => t.status === 'ACTIVE').length;
    const completed = areaTasks.filter((t) => t.status === 'COMPLETED').length;
    const pruned = areaTasks.filter((t) => t.status === 'PRUNED').length;

    // Minutos totais na área
    const minutes = areaSessions.reduce((sum, s) => sum + s.duration_minutes, 0);

    return {
      id: area.id,
      name: area.name,
      color: area.color,
      active,
      completed,
      pruned,
      total: areaTasks.length,
      minutes,
    };
  });

  // Ordenar áreas por minutos dedicados (Áreas com maior dedicação)
  const sortedAreaStats = [...areaStats].sort((a, b) => b.minutes - a.minutes);

  // Áreas sobrecarregadas: 7+ tarefas ativas
  const overloadedAreas = areaStats.filter((a) => a.active >= 7);

  // Ranking de Tarefas por Dedicação (Top 5)
  const topTasks = allTasks
    .map((task) => {
      const taskSessions = allSessions.filter((s) => s.task_id === task.id);
      const minutes = taskSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
      return {
        id: task.id,
        title: task.title,
        life_area_id: task.life_area_id,
        status: task.status,
        minutes,
      };
    })
    .filter((t) => t.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 5);

  const areaMap = new Map(activeAreas.map((a) => [a.id, a.name]));

  // Últimas sessões registradas
  const recentSessions = allSessions.slice(0, 8);

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Estatísticas do Cultivo</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">Monitore seu foco, constância e o crescimento do seu jardim</p>
      </div>

      {totalAreasActivas === 0 ? (
        <Card variant="glass" className="text-center py-16 max-w-md mx-auto space-y-4 border border-dashed border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl">
            📊
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Sem Dados Estatísticos</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
              Você ainda não plantou nenhuma área da vida. Crie uma área no Jardim e registre sessões de dedicação para começar a visualizar suas métricas de progresso.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/garden"
              className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
            >
              Começar a Plantar
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {/* Grid de Indicadores Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card variant="glass" className="p-6">
              <span className="text-xs font-semibold text-zinc-500 uppercase">Tempo Dedicado Real</span>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{formattedHours}</p>
              <span className="text-[10px] text-zinc-400 mt-1 block">Soma real de todas as sessões registradas</span>
            </Card>

            <Card variant="glass" className="p-6">
              <span className="text-xs font-semibold text-zinc-500 uppercase">Áreas da Vida Ativas</span>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{totalAreasActivas}</p>
          <span className="text-[10px] text-zinc-400 mt-1 block">Árvores plantadas no Jardim</span>
        </Card>

        <Card variant="glass" className="p-6">
          <span className="text-xs font-semibold text-zinc-500 uppercase">Taxa de Colheita</span>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{taxaDeColheita}%</p>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            {totalTasksConcluidas} colheitas / {totalTasksPodadas} podas
          </span>
        </Card>

        <Card variant="glass" className="p-6">
          <span className="text-xs font-semibold text-zinc-500 uppercase">Subtarefas Concluídas</span>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{subtaskCompletionRate}%</p>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            {completedSubtasks} de {totalSubtasks} concluídas
          </span>
        </Card>

        <Card variant="glass" className="p-6">
          <span className="text-xs font-semibold text-zinc-500 uppercase">Tarefas Ativas</span>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{totalTasksActivas}</p>
          <span className="text-[10px] text-zinc-400 mt-1 block">Sementes em fase de cultivo</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição por Categoria (baseado em tempo real de dedicação) */}
        <Card variant="glass" className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-zinc-800 dark:text-white">Dedicação por Área da Vida</h3>
          <div className="space-y-4 pt-2">
            {sortedAreaStats.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">Nenhuma área da vida cadastrada.</p>
            ) : (
              sortedAreaStats.map((stat) => {
                const percentage = totalMinutes > 0
                  ? Math.round((stat.minutes / totalMinutes) * 100)
                  : 0;

                const hrsArea = Math.floor(stat.minutes / 60);
                const minsArea = stat.minutes % 60;
                const areaTimeLabel = hrsArea > 0 ? `${hrsArea}h ${minsArea}m` : `${minsArea}m`;

                return (
                  <div key={stat.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-zinc-700 dark:text-zinc-350">
                        {stat.name} <span className="text-[10px] text-zinc-450 dark:text-zinc-500">({areaTimeLabel} dedicado, {stat.completed} colhidas)</span>
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{percentage}%</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-350"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Top Tarefas com Mais Dedicação */}
        <Card variant="glass" className="space-y-4">
          <h3 className="font-bold text-zinc-800 dark:text-white">Top 5 Sementes Cultivadas</h3>
          {topTasks.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">Nenhum registro de tempo efetuado.</p>
          ) : (
            <div className="space-y-3">
              {topTasks.map((t, idx) => {
                const hrsTask = Math.floor(t.minutes / 60);
                const minsTask = t.minutes % 60;
                const taskTimeLabel = hrsTask > 0 ? `${hrsTask}h ${minsTask}m` : `${minsTask}m`;
                const areaName = areaMap.get(t.life_area_id) || 'Área';

                return (
                  <div key={t.id} className="flex justify-between items-center text-xs p-2.5 bg-zinc-100/50 dark:bg-zinc-950/40 rounded-xl border border-zinc-150 dark:border-zinc-900">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">#{idx + 1}</span>
                      <div className="truncate">
                        <p className="font-semibold text-zinc-850 dark:text-zinc-200 truncate">{t.title}</p>
                        <p className="text-[9px] text-zinc-450 dark:text-zinc-550 uppercase font-semibold">{areaName}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full font-bold shrink-0">
                      {taskTimeLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Últimas Sessões Registradas */}
        <Card variant="glass" className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-zinc-800 dark:text-white">Últimas Sessões de Trabalho</h3>
          {recentSessions.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">Nenhuma sessão registrada recentemente.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold bg-zinc-50 dark:bg-zinc-950/50">
                    <th className="py-2 px-3">Tarefa</th>
                    <th className="py-2 px-3">Área</th>
                    <th className="py-2 px-3">Duração</th>
                    <th className="py-2 px-3">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((session) => {
                    const taskTitle = allTasks.find((t) => t.id === session.task_id)?.title || 'Tarefa Removida';
                    const areaName = areaMap.get(session.life_area_id) || 'Área';
                    return (
                      <tr key={session.id} className="border-b last:border-0 border-zinc-150 dark:border-zinc-900 hover:bg-zinc-100/30 dark:hover:bg-zinc-900/30">
                        <td className="py-2.5 px-3 font-semibold text-zinc-850 dark:text-zinc-200 truncate max-w-[150px]" title={taskTitle}>
                          {taskTitle}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-650 dark:text-zinc-350 font-medium">
                          {areaName}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-bold">
                          {session.duration_minutes} min
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400">
                          {formatFriendlyDate(session.worked_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Informações Auxiliares (Sobrecarga & Status) */}
        <div className="space-y-6">
          {/* Áreas Sobrecarregadas */}
          <Card variant="glass" className="space-y-3">
            <h3 className="font-bold text-zinc-800 dark:text-white">Áreas Sobrecarregadas</h3>
            {overloadedAreas.length === 0 ? (
              <div className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl border border-emerald-500/20 text-xs flex gap-2 items-center">
                <span>🍀</span>
                <span>Nenhuma área sobrecarregada! Bom fluxo de trabalho.</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-red-500/10 text-red-800 dark:text-red-300 p-3 rounded-xl border border-red-500/20 text-xs mb-2">
                  ⚠️ <strong>Alerta de Foco:</strong> Estas áreas possuem 7 ou mais tarefas ativas simultaneamente.
                </div>
                {overloadedAreas.map((area) => (
                  <div key={area.id} className="flex justify-between items-center text-xs p-2.5 bg-zinc-150/40 dark:bg-zinc-950/40 rounded-xl">
                    <span className="font-semibold text-zinc-850 dark:text-zinc-200">{area.name}</span>
                    <span className="px-2 py-0.5 bg-red-500/10 text-red-600 rounded-full font-bold">
                      {area.active} ativas
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Distribuição por Status */}
          <Card variant="glass" className="space-y-4">
            <h3 className="font-bold text-zinc-800 dark:text-white">Distribuição Geral por Status</h3>
            <div className="space-y-3 text-xs pt-1">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Ativas</span>
                  <span className="font-bold">{totalTasksActivas}</span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{
                      width: `${allTasks.length > 0 ? (totalTasksActivas / allTasks.length) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Colhidas (Concluídas)</span>
                  <span className="font-bold">{totalTasksConcluidas}</span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{
                      width: `${allTasks.length > 0 ? (totalTasksConcluidas / allTasks.length) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Podadas (Canceladas)</span>
                  <span className="font-bold">{totalTasksPodadas}</span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-red-500 h-full rounded-full"
                    style={{
                      width: `${allTasks.length > 0 ? (totalTasksPodadas / allTasks.length) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
