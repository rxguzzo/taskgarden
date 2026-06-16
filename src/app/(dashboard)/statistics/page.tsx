import React from 'react';
import { redirect } from 'next/navigation';
import { getServerClient } from '../../../services/supabase/server';
import { Card } from '../../../components/ui/Card';

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

  const activeAreas = areas || [];
  const allTasks = tasks || [];

  const totalAreasActivas = activeAreas.length;
  const totalTasksActivas = allTasks.filter((t) => t.status === 'ACTIVE').length;
  const totalTasksConcluidas = allTasks.filter((t) => t.status === 'COMPLETED').length;
  const totalTasksPodadas = allTasks.filter((t) => t.status === 'PRUNED').length;
  const totalTasksHistoricas = totalTasksConcluidas + totalTasksPodadas;

  // Esforço estimado: concluídas * 45 minutos
  const totalMinutes = totalTasksConcluidas * 45;
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const formattedHours = hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;

  // Taxa de colheita: concluídas / (concluídas + podadas)
  const taxaDeColheita = totalTasksHistoricas > 0
    ? Math.round((totalTasksConcluidas / totalTasksHistoricas) * 100)
    : 0;

  // Estatísticas por Área de Vida
  const areaStats = activeAreas.map((area) => {
    const areaTasks = allTasks.filter((t) => t.life_area_id === area.id);
    const active = areaTasks.filter((t) => t.status === 'ACTIVE').length;
    const completed = areaTasks.filter((t) => t.status === 'COMPLETED').length;
    const pruned = areaTasks.filter((t) => t.status === 'PRUNED').length;
    return {
      id: area.id,
      name: area.name,
      color: area.color,
      active,
      completed,
      pruned,
      total: areaTasks.length,
    };
  });

  // Áreas sobrecarregadas: 7+ tarefas ativas
  const overloadedAreas = areaStats.filter((a) => a.active >= 7);

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Estatísticas do Cultivo</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">Monitore seu foco, constância e o crescimento do seu jardim</p>
      </div>

      {/* Grid de Indicadores Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" className="p-6">
          <span className="text-xs font-semibold text-zinc-500 uppercase">Tempo Dedicado Real (Estimado)</span>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{formattedHours}</p>
          <span className="text-[10px] text-zinc-400 mt-1 block">Baseado em sementes colhidas (45m/cada)</span>
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
          <span className="text-xs font-semibold text-zinc-500 uppercase">Tarefas Ativas</span>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{totalTasksActivas}</p>
          <span className="text-[10px] text-zinc-400 mt-1 block">Sementes em fase de cultivo</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição por Categoria */}
        <Card variant="glass" className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-zinc-800 dark:text-white">Distribuição por Área da Vida</h3>
          <div className="space-y-4 pt-2">
            {areaStats.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">Nenhuma área da vida cadastrada.</p>
            ) : (
              areaStats.map((stat) => {
                const percentage = allTasks.length > 0
                  ? Math.round((stat.total / allTasks.length) * 100)
                  : 0;

                return (
                  <div key={stat.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">
                        {stat.name} ({stat.active} ativas, {stat.completed} colhidas)
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
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{area.name}</span>
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
    </div>
  );
}
