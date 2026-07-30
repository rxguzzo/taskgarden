import { PlantStage, PlantVisualSize, HealthStatus, Task, Subtask } from './types';

/**
 * Calcula o progresso de uma tarefa com base nas suas subtarefas ativas (não deletadas).
 * Se não houver subtarefas, retorna o valor de tasks.progress.
 */
export function calculateTaskProgress(task: Task, subtasks?: Subtask[]): number {
  if (!subtasks || subtasks.length === 0) {
    return task.progress;
  }
  const activeSubtasks = subtasks.filter(s => s.deleted_at === null);
  if (activeSubtasks.length === 0) {
    return task.progress;
  }
  const completedCount = activeSubtasks.filter(s => s.is_completed).length;
  return Math.round((completedCount / activeSubtasks.length) * 100);
}

/**
 * Calcula o progresso médio das tarefas ativas (ACTIVE) de uma área de vida.
 * Se não houver tarefas ativas, retorna null.
 */
export function getAreaProgress(tasks: Task[], areaId: string): number | null {
  const activeTasks = tasks.filter(t => t.life_area_id === areaId && t.status === 'ACTIVE' && t.deleted_at === null);
  if (activeTasks.length === 0) return null;

  const sumProgress = activeTasks.reduce((sum, t) => {
    const p = calculateTaskProgress(t, t.subtasks);
    return sum + Math.max(0, Math.min(100, p));
  }, 0);
  return Math.round(sumProgress / activeTasks.length);
}

/**
 * Retorna o rótulo amigável em português para o estágio da planta.
 */
export function getStageLabel(stage: PlantStage): string {
  switch (stage) {
    case 'SEED': return 'Semente';
    case 'SPROUT': return 'Broto';
    case 'SAPLING': return 'Árvore Jovem';
    case 'TREE': return 'Árvore Adulta';
    case 'STRONG': return 'Árvore Forte';
    case 'MAJESTIC': return 'Árvore Majestosa';
    default: return 'Desconhecido';
  }
}

/**
 * Retorna o rótulo amigável em português para o tamanho visual da planta.
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
 * Retorna o rótulo amigável em português para o estado de saúde da área.
 */
export function getHealthStatusLabel(status: HealthStatus): string {
  switch (status) {
    case 'HEALTHY': return 'Saudável';
    case 'REGULAR': return 'Regular';
    case 'IDLE': return 'Parada';
    case 'WITHERED': return 'Murcha';
    default: return 'Desconhecido';
  }
}

/**
 * Retorna a classe de cor CSS para o estado de saúde da área.
 */
export function getHealthStatusColorClass(status: HealthStatus): string {
  switch (status) {
    case 'HEALTHY':
      return 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20';
    case 'REGULAR':
      return 'bg-green-500/10 text-green-800 dark:text-green-300 border-green-500/20';
    case 'IDLE':
      return 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20';
    case 'WITHERED':
      return 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/25';
    default:
      return 'bg-zinc-500/10 text-zinc-800 dark:text-zinc-300 border-zinc-500/20';
  }
}

/**
 * Calcula a quantidade de tarefas ativas de uma área de vida.
 */
export function getAreaActiveTasksCount(tasks: Task[], areaId: string): number {
  return tasks.filter(t => t.life_area_id === areaId && t.status === 'ACTIVE' && t.deleted_at === null).length;
}

/**
 * Calcula a quantidade de tarefas concluídas de uma área de vida.
 */
export function getAreaCompletedTasksCount(tasks: Task[], areaId: string): number {
  return tasks.filter(t => t.life_area_id === areaId && t.status === 'COMPLETED' && t.deleted_at === null).length;
}

/**
 * Calcula a quantidade de tarefas podadas de uma área de vida.
 */
export function getAreaPrunedTasksCount(tasks: Task[], areaId: string): number {
  return tasks.filter(t => t.life_area_id === areaId && t.status === 'PRUNED' && t.deleted_at === null).length;
}

/**
 * Calcula o estágio de crescimento da árvore (PlantStage) baseado no XP total.
 */
export function calculatePlantStage(xp: number): PlantStage {
  if (xp < 50) return 'SEED';
  if (xp < 150) return 'SPROUT';
  if (xp < 350) return 'SAPLING';
  if (xp < 700) return 'TREE';
  if (xp < 1200) return 'STRONG';
  return 'MAJESTIC';
}

/**
 * Retorna os limites de XP de um estágio específico.
 */
export function getStageXpBounds(stage: PlantStage): { prev: number; next: number } {
  switch (stage) {
    case 'SEED': return { prev: 0, next: 50 };
    case 'SPROUT': return { prev: 50, next: 150 };
    case 'SAPLING': return { prev: 150, next: 350 };
    case 'TREE': return { prev: 350, next: 700 };
    case 'STRONG': return { prev: 700, next: 1200 };
    case 'MAJESTIC': return { prev: 1200, next: 1200 };
    default: return { prev: 0, next: 50 };
  }
}

/**
 * Calcula o tamanho visual da planta (PlantVisualSize) baseado no estágio.
 */
export function calculatePlantVisualSize(stage: PlantStage): PlantVisualSize {
  if (stage === 'SEED' || stage === 'SPROUT') {
    return 'SMALL';
  }
  if (stage === 'SAPLING' || stage === 'TREE') {
    return 'MEDIUM';
  }
  return 'LARGE';
}

/**
 * Calcula o estado de saúde da área (HealthStatus) baseado no score de consistência SAT.
 */
export function calculateHealthStatus(sat: number): HealthStatus {
  if (sat >= 5) return 'HEALTHY';
  if (sat >= 2) return 'REGULAR';
  if (sat > 0) return 'IDLE';
  return 'WITHERED';
}

/**
 * Calcula o XP de uma área com base nas tarefas, subtarefas concluídas, tempo focado e rotinas cumpridas.
 */
export function calculateAreaXp(
  completedTasksCount: number,
  completedSubtasksCount: number,
  totalWorkMinutes: number,
  habitCompletionsCount: number
): number {
  const taskXp = completedTasksCount * 20;
  const subtaskXp = completedSubtasksCount * 5;
  const timeXp = Math.floor(totalWorkMinutes / 3);
  const habitXp = habitCompletionsCount * 10;
  return taskXp + subtaskXp + timeXp + habitXp;
}

/**
 * Calcula o score de atividade recente (últimos 7 dias) para determinar a saúde da área.
 */
export function calculateRecentActivityScore(
  tasks: { status: string; completed_at: string | null }[],
  subtasks: { is_completed: boolean; completed_at: string | null }[],
  workSessions: { duration_minutes: number; worked_at: string }[],
  completions: { completed_date: string }[]
): { sat: number; recentActionsCount: number } {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const sevenDaysAgoStr = sevenDaysAgo.toISOString().substring(0, 10);

  let sat = 0;
  let recentActionsCount = 0;

  // 1. Tarefas concluídas nos últimos 7 dias
  tasks.forEach(t => {
    if (t.status === 'COMPLETED' && t.completed_at) {
      const compDate = new Date(t.completed_at);
      if (compDate >= sevenDaysAgo) {
        sat += 1;
        recentActionsCount += 1;
      }
    }
  });

  // 2. Subtarefas concluídas nos últimos 7 dias
  subtasks.forEach(s => {
    if (s.is_completed && s.completed_at) {
      const compDate = new Date(s.completed_at);
      if (compDate >= sevenDaysAgo) {
        sat += 0.5;
        recentActionsCount += 1;
      }
    }
  });

  // 3. Sessões de trabalho nos últimos 7 dias (worked_at no formato YYYY-MM-DD)
  workSessions.forEach(w => {
    if (w.worked_at >= sevenDaysAgoStr) {
      sat += 1;
      recentActionsCount += 1;
    }
  });

  // 4. Conclusões de rotinas nos últimos 7 dias (completed_date no formato YYYY-MM-DD)
  completions.forEach(c => {
    if (c.completed_date >= sevenDaysAgoStr) {
      sat += 1;
      recentActionsCount += 1;
    }
  });

  return { sat, recentActionsCount };
}
