export type PlantStage = 'SEED' | 'SPROUT' | 'SAPLING' | 'TREE' | 'MATURE';

export type PlantVisualSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export interface TaskDemo {
  id: string;
  title: string;
  category: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PRUNED';
  progress: number; // 0 to 100
  growthPoints: number;
  stage: PlantStage;
  visualSize: PlantVisualSize;
  dueDate?: string;
  pruneReason?: string;
  isThirsty?: boolean;
  isDelayed?: boolean;
}
