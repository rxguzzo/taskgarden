import { PlantStage, PlantVisualSize } from './types';

/**
 * Retorna o estágio da planta baseado no progresso da tarefa (0 a 100)
 */
export function getStageFromProgress(progress: number): PlantStage {
  const p = Math.max(0, Math.min(100, progress));
  if (p < 10) return 'SEED';
  if (p < 30) return 'SPROUT';
  if (p < 60) return 'SAPLING';
  if (p < 90) return 'TREE';
  return 'MATURE';
}

/**
 * Retorna o tamanho visual baseado na quantidade de pontos de crescimento (growthPoints)
 */
export function getVisualSizeFromPoints(points: number): PlantVisualSize {
  if (points < 50) return 'SMALL';
  if (points < 200) return 'MEDIUM';
  return 'LARGE';
}

/**
 * Retorna o rótulo amigável em português para o estágio
 */
export function getStageLabel(stage: PlantStage): string {
  switch (stage) {
    case 'SEED': return 'Semente';
    case 'SPROUT': return 'Broto';
    case 'SAPLING': return 'Muda';
    case 'TREE': return 'Árvore';
    case 'MATURE': return 'Árvore Madura';
  }
}
