export type PlantStage = 'SEED' | 'SPROUT' | 'SAPLING' | 'TREE' | 'MATURE';
export type PlantVisualSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export type HealthStatus = 'HEALTHY' | 'THIRSTY' | 'IDLE' | 'OVERLOADED';

export type TaskStatus = 'ACTIVE' | 'COMPLETED' | 'PRUNED';
export type TaskDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type LifeAreaColor =
  | 'emerald'
  | 'blue'
  | 'purple'
  | 'amber'
  | 'rose'
  | 'slate';

export interface LifeArea {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: LifeAreaColor;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Task {
  id: string;
  life_area_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  progress: number;
  difficulty: TaskDifficulty;
  priority: TaskPriority;
  due_date: string | null;
  prune_reason: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  subtasks?: Subtask[];
}

export interface LifeAreaSummary extends LifeArea {
  stage: PlantStage;
  visualSize: PlantVisualSize;
  totalMinutes: number;
  healthStatus: HealthStatus;
  currentProgress: number | null;
  activeTasksCount: number;
  completedTasksCount: number;
  prunedTasksCount: number;
  lastActivityAt: string | null;
}

export type WorkSessionSource = 'MANUAL' | 'TIMER' | 'CALENDAR_CONFIRMED';

export interface WorkSession {
  id: string;
  user_id: string;
  task_id: string;
  life_area_id: string;
  duration_minutes: number;
  worked_at: string; // Formato YYYY-MM-DD
  note: string | null;
  source: WorkSessionSource;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Subtask {
  id: string;
  user_id: string;
  task_id: string;
  life_area_id: string;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DemoLifeArea {
  id: string;
  name: string;
  description: string;
  stage: PlantStage;
  visualSize: PlantVisualSize;
  totalMinutes: number;
  healthStatus: 'HEALTHY' | 'THIRSTY' | 'IDLE' | 'OVERLOADED';
  lastActivityAt: string;
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
