import { PlantStage, PlantVisualSize, DemoAreaTask } from './types';

/**
 * Retorna o rótulo amigável em português para o estágio da planta
 */
export function getStageLabel(stage: PlantStage): string {
  switch (stage) {
    case 'SEED': return 'Semente';
    case 'SPROUT': return 'Broto';
    case 'SAPLING': return 'Muda';
    case 'TREE': return 'Árvore';
    case 'MATURE': return 'Árvore Madura';
    default: return 'Desconhecido';
  }
}

/**
 * Retorna o rótulo amigável em português para o tamanho visual da planta
 */
export function getVisualSizeLabel(size: PlantVisualSize): string {
  switch (size) {
    case 'SMALL': return 'Pequena';
    case 'MEDIUM': return 'Média';
    case 'LARGE': return 'Grande';
    default: return 'Padrão';
  }
}

/**
 * Retorna o rótulo amigável em português para o estado de saúde da área
 */
export function getHealthStatusLabel(status: 'HEALTHY' | 'THIRSTY' | 'IDLE' | 'OVERLOADED'): string {
  switch (status) {
    case 'HEALTHY': return 'Saudável';
    case 'THIRSTY': return 'Com Sede';
    case 'IDLE': return 'Parada';
    case 'OVERLOADED': return 'Sobrecarregada';
    default: return 'Desconhecido';
  }
}

/**
 * Retorna a classe de cor CSS para o estado de saúde da área
 */
export function getHealthStatusColorClass(status: 'HEALTHY' | 'THIRSTY' | 'IDLE' | 'OVERLOADED'): string {
  switch (status) {
    case 'HEALTHY':
      return 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20';
    case 'THIRSTY':
      return 'bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/20';
    case 'IDLE':
      return 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20';
    case 'OVERLOADED':
      return 'bg-red-500/10 text-red-800 dark:text-red-300 border-red-500/20';
    default:
      return 'bg-zinc-500/10 text-zinc-800 dark:text-zinc-300 border-zinc-500/20';
  }
}

/**
 * Calcula a quantidade de tarefas ativas de uma área de vida
 */
export function getAreaActiveTasksCount(tasks: DemoAreaTask[], areaId: string): number {
  return tasks.filter(t => t.lifeAreaId === areaId && t.status === 'ACTIVE').length;
}

/**
 * Calcula a quantidade de tarefas concluídas de uma área de vida
 */
export function getAreaCompletedTasksCount(tasks: DemoAreaTask[], areaId: string): number {
  return tasks.filter(t => t.lifeAreaId === areaId && t.status === 'COMPLETED').length;
}

/**
 * Calcula a quantidade de tarefas podadas de uma área de vida
 */
export function getAreaPrunedTasksCount(tasks: DemoAreaTask[], areaId: string): number {
  return tasks.filter(t => t.lifeAreaId === areaId && t.status === 'PRUNED').length;
}

/**
 * Calcula o progresso médio das tarefas ativas de uma área de vida.
 * Se não houver tarefas ativas, retorna null.
 */
export function getAreaProgress(tasks: DemoAreaTask[], areaId: string): number | null {
  const activeTasks = tasks.filter(t => t.lifeAreaId === areaId && t.status === 'ACTIVE');
  if (activeTasks.length === 0) return null;

  const sumProgress = activeTasks.reduce((sum, t) => sum + Math.max(0, Math.min(100, t.progress)), 0);
  return Math.round(sumProgress / activeTasks.length);
}
