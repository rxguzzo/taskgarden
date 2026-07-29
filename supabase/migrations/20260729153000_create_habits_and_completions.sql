-- Módulo 10.2 — Rotinas / Hábitos Recorrentes

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Criação da Tabela de Rotinas (habits)
CREATE TABLE public.habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  life_area_id uuid NOT NULL,
  
  title varchar(255) NOT NULL,
  description varchar(1000),
  
  frequency varchar(20) NOT NULL DEFAULT 'DAILY',
  custom_days integer[] DEFAULT '{}',
  day_of_month integer,
  
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  deleted_at timestamptz,

  -- Constraints de Integridade e Regras de Frequência
  CONSTRAINT habits_id_user_id_key UNIQUE (id, user_id),
  
  CONSTRAINT fk_habit_life_area FOREIGN KEY (life_area_id, user_id)
    REFERENCES public.life_areas(id, user_id)
    ON DELETE RESTRICT,
    
  CONSTRAINT chk_habit_title CHECK (char_length(pg_catalog.btrim(title)) BETWEEN 1 AND 255),
  
  CONSTRAINT chk_habit_description CHECK (description IS NULL OR char_length(description) <= 1000),
  
  CONSTRAINT chk_habit_frequency CHECK (frequency IN ('DAILY', 'WEEKDAYS', 'CUSTOM_WEEKLY', 'MONTHLY')),
  
  CONSTRAINT chk_habit_day_of_month CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31))
);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER habits_updated_at_trig
BEFORE UPDATE ON public.habits
FOR EACH ROW
EXECUTE FUNCTION public.set_life_areas_tasks_updated_at();

-- 2. Criação da Tabela de Conclusões de Rotinas (habit_completions)
CREATE TABLE public.habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL,
  user_id uuid NOT NULL,
  completed_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),

  -- Chaves Compostas para garantir integridade e posse
  CONSTRAINT fk_completion_habit FOREIGN KEY (habit_id, user_id)
    REFERENCES public.habits(id, user_id)
    ON DELETE CASCADE,

  CONSTRAINT unique_habit_user_date_completion UNIQUE (habit_id, user_id, completed_date)
);

-- 3. Otimização e Índices de Busca
CREATE INDEX idx_habits_user_active
ON public.habits(user_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_habits_life_area
ON public.habits(life_area_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_habit_completions_user_date
ON public.habit_completions(user_id, completed_date);

CREATE INDEX idx_habit_completions_habit_date
ON public.habit_completions(habit_id, completed_date);

-- 4. Revogação de Acesso para Roles Públicas
REVOKE ALL ON public.habits FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.habit_completions FROM PUBLIC, anon, authenticated;

-- 5. Concessão de Privilégios Mínimos à Role Authenticated
GRANT SELECT, INSERT, UPDATE ON public.habits TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.habit_completions TO authenticated;

-- 6. Políticas de Segurança (Row Level Security)
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

-- Políticas para habits
CREATE POLICY "authenticated_select_own_habits"
ON public.habits
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "authenticated_insert_own_habits"
ON public.habits
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_update_own_habits"
ON public.habits
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Políticas para habit_completions
CREATE POLICY "authenticated_select_own_completions"
ON public.habit_completions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "authenticated_insert_own_completions"
ON public.habit_completions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_delete_own_completions"
ON public.habit_completions
FOR DELETE TO authenticated
USING (auth.uid() = user_id);
