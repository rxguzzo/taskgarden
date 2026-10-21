export type PlantStage = 'SEED' | 'SPROUT' | 'SAPLING' | 'TREE' | 'STRONG' | 'MAJESTIC' | 'MATURE';
export type PlantVisualSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export type HealthStatus = 'HEALTHY' | 'REGULAR' | 'IDLE' | 'WITHERED';

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
  xp: number;
  nextStageXp: number;
  prevStageXp: number;
  recentActionsCount: number;
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

export type HabitFrequency = 'DAILY' | 'WEEKDAYS' | 'CUSTOM_WEEKLY' | 'WEEKLY' | 'MONTHLY';

export interface Habit {
  id: string;
  user_id: string;
  life_area_id: string;
  title: string;
  description: string | null;
  frequency: HabitFrequency;
  custom_days: number[]; // Array de inteiros (0 = Domingo, 6 = Sábado)
  day_of_month: number | null; // Dia do mês (1 a 31)
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string; // Formato YYYY-MM-DD puro
  period_type: 'DAY' | 'WEEK' | 'MONTH';
  period_key: string;
  created_at: string;
}

export type LifeAreaEventStatus = 'PENDING' | 'COMPLETED' | 'ARCHIVED';

export interface LifeAreaEvent {
  id: string;
  user_id: string;
  life_area_id: string;
  title: string;
  description: string | null;
  event_date: string; // YYYY-MM-DD
  event_time: string | null; // HH:MM:SS ou HH:MM
  status: LifeAreaEventStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
