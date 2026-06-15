import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { demoLifeAreas } from '../../../../mocks/demo-life-areas';
import { demoAreaTasks } from '../../../../mocks/demo-area-tasks';
import { Card } from '../../../../components/ui/Card';
import { PlantVisual } from '../../../../components/plants/PlantVisual';
import { formatFriendlyDate } from '../../../../utils/date';
import { 
  getStageLabel, 
  getVisualSizeLabel,
  getHealthStatusLabel,
  getHealthStatusColorClass,
  getAreaActiveTasksCount, 
  getAreaCompletedTasksCount, 
  getAreaPrunedTasksCount,
  getAreaProgress 
} from '../../../../domain/growth/rules';

type AreaDetailPageProps = {
  params: Promise<{ areaId: string }>;
};

// Gera os parâmetros estáticos para pré-compilação no build do Next.js
export async function generateStaticParams() {
  return demoLifeAreas.map((area) => ({
    areaId: area.id,
  }));
}

export default async function AreaDetailPage({ params }: AreaDetailPageProps) {
  const { areaId } = await params;
  
  // Localiza a área correspondente
  const area = demoLifeAreas.find(a => a.id === areaId);
  
  // Se não existir, dispara 404 global
  if (!area) {
    notFound();
  }

  // Filtra as tarefas associadas a esta área
  const areaTasks = demoAreaTasks.filter(t => t.lifeAreaId === area.id);
  const activeTasks = areaTasks.filter(t => t.status === 'ACTIVE');
  const completedTasks = areaTasks.filter(t => t.status === 'COMPLETED');
  const prunedTasks = areaTasks.filter(t => t.status === 'PRUNED');

  // Deriva dados dinamicamente
  const activeCount = getAreaActiveTasksCount(demoAreaTasks, area.id);
  const completedCount = getAreaCompletedTasksCount(demoAreaTasks, area.id);
  const prunedCount = getAreaPrunedTasksCount(demoAreaTasks, area.id);
  const currentProgress = getAreaProgress(demoAreaTasks, area.id);
  
  const hoursDedicated = Math.round(area.totalMinutes / 60);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Barra de Navegação Superior / Voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-6">
        <div className="flex items-center space-x-3">
          <Link
            href="/garden"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            title="Voltar ao Jardim"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">Área da Vida</span>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{area.name}</h1>
          </div>
        </div>

        {/* Botão Plantar Tarefa Desabilitado com tooltip provisório */}
        <div>
          <button
            type="button"
            disabled
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600/50 text-white font-semibold rounded-xl text-sm cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm"
            title="A criação de tarefas nesta área estará disponível em breve no módulo de banco de dados."
          >
            <span>+ Plantar tarefa</span>
            <span className="text-[10px] bg-emerald-700/60 px-1.5 py-0.5 rounded text-emerald-200">Em breve</span>
          </button>
        </div>
      </div>

      {/* Banner Informativo de Mocks */}
      <div className="bg-amber-500/10 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 p-4 rounded-2xl border border-amber-500/20 text-xs flex justify-between items-center">
        <span>⚠️ **Dados Demonstrativos**: Esta tela exibe as tarefas fictícias associadas à área de {area.name}.</span>
        <span className="font-semibold underline hidden sm:inline">Modo Leitura</span>
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
              <PlantVisual stage={area.stage} visualSize={area.visualSize} animated />
            </div>

            {/* Painel Estatístico Acumulado */}
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-900/50 pb-2">
                <span className="text-zinc-500 dark:text-zinc-400">Estágio:</span>
                <span className="font-bold text-zinc-800 dark:text-white">{getStageLabel(area.stage)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-900/50 pb-2">
                <span className="text-zinc-500 dark:text-zinc-400">Tamanho:</span>
                <span className="font-bold text-zinc-800 dark:text-white">{getVisualSizeLabel(area.visualSize)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-900/50 pb-2">
                <span className="text-zinc-500 dark:text-zinc-400">Frequência/Saúde:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getHealthStatusColorClass(area.healthStatus)}`}>
                  {getHealthStatusLabel(area.healthStatus)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-900/50 pb-2">
                <span className="text-zinc-500 dark:text-zinc-400">Esforço Total:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{hoursDedicated} horas</span>
              </div>
              <div className="flex justify-between items-center text-sm pb-1">
                <span className="text-zinc-500 dark:text-zinc-400">Última Rega:</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{formatFriendlyDate(area.lastActivityAt)}</span>
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
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
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

        {/* Lado Direito: Listagem de Tarefas Filtradas */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Tarefas Ativas */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
              🌱 Tarefas Ativas ({activeCount})
            </h2>
            
            {activeTasks.length === 0 ? (
              <Card variant="solid" className="text-center py-8 text-sm text-zinc-500 dark:text-zinc-400">
                Nenhuma tarefa ativa cadastrada nesta área de vida.
              </Card>
            ) : (
              <div className="space-y-3">
                {activeTasks.map(task => (
                  <Card key={task.id} variant="glass" className="p-4 hover:border-emerald-500/10 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm text-zinc-800 dark:text-white">{task.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                          <span className="bg-zinc-100 dark:bg-zinc-950 px-2 py-0.5 rounded font-medium">
                            Dificuldade: {task.difficulty}
                          </span>
                          <span className="bg-zinc-100 dark:bg-zinc-950 px-2 py-0.5 rounded font-medium">
                            Prioridade: {task.priority}
                          </span>
                          {task.dueDate && (
                            <span>Prazo: {formatFriendlyDate(task.dueDate)}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Barra de Progresso Individual */}
                      <div className="flex items-center gap-3 w-full sm:w-44 text-right justify-between sm:justify-end">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{task.progress}%</span>
                        <div className="w-24 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${task.progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Tarefas Concluídas */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
              ✓ Concluídas & Colhidas ({completedCount})
            </h2>
            
            {completedTasks.length === 0 ? (
              <Card variant="solid" className="text-center py-6 text-sm text-zinc-500 dark:text-zinc-400">
                Nenhuma tarefa concluída no histórico recente.
              </Card>
            ) : (
              <div className="space-y-2">
                {completedTasks.map(task => (
                  <Card key={task.id} variant="solid" className="p-3 opacity-80 border-l-2 border-l-emerald-500">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 line-through">
                        {task.title}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                        Colhida
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Tarefas Podadas */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
              ✂ Podadas & Arquivadas ({prunedCount})
            </h2>
            
            {prunedTasks.length === 0 ? (
              <Card variant="solid" className="text-center py-6 text-sm text-zinc-500 dark:text-zinc-400">
                Nenhuma tarefa podada nesta área.
              </Card>
            ) : (
              <div className="space-y-2">
                {prunedTasks.map(task => (
                  <Card key={task.id} variant="solid" className="p-3 opacity-70 border-l-2 border-l-red-500 bg-red-500/5">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5">
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        {task.title}
                      </span>
                      {task.pruneReason && (
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 italic">
                          Motivo: &quot;{task.pruneReason}&quot;
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
