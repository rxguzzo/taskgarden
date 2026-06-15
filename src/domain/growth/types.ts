export type PlantStage = 'SEED' | 'SPROUT' | 'SAPLING' | 'TREE' | 'MATURE';

export type PlantVisualSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export interface DemoLifeArea {
  id: string;
  name: string;
  description: string;
  stage: PlantStage;
  visualSize: PlantVisualSize;
  totalMinutes: number;
  healthStatus: 'HEALTHY' | 'THIRSTY' | 'IDLE' | 'OVERLOADED';
  lastActivityAt: string; // ISO String (ex: "2026-06-14T18:30:00.000Z")
}

export interface DemoAreaTask {
  id: string;
  lifeAreaId: string;
  title: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PRUNED';
  progress: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  pruneReason?: string;
}
