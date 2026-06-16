-- Módulo 2 — Áreas da Vida e Tarefas Reais

-- UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Função específica do módulo para updated_at
CREATE OR REPLACE FUNCTION public.set_life_areas_tasks_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_life_areas_tasks_updated_at() FROM PUBLIC, anon, authenticated;

-- Tabela de Áreas da Vida
CREATE TABLE public.life_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name varchar(100) NOT NULL,
  description varchar(500),
  color varchar(50) NOT NULL DEFAULT 'emerald',

  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  deleted_at timestamptz,

  CONSTRAINT life_areas_id_user_id_key UNIQUE (id, user_id),

  CONSTRAINT chk_life_area_name_not_blank CHECK (
    char_length(pg_catalog.btrim(name)) BETWEEN 1 AND 100
  ),

  CONSTRAINT chk_life_area_description_length CHECK (
    description IS NULL OR char_length(description) <= 500
  ),

  CONSTRAINT chk_life_area_color CHECK (
    color IN ('emerald', 'blue', 'purple', 'amber', 'rose', 'slate')
  )
);

CREATE TRIGGER life_areas_updated_at_trig
BEFORE UPDATE ON public.life_areas
FOR EACH ROW
EXECUTE FUNCTION public.set_life_areas_tasks_updated_at();

-- Índice único parcial para impedir áreas ativas duplicadas por usuário
CREATE UNIQUE INDEX unique_active_life_area_name_per_user
ON public.life_areas(user_id, pg_catalog.lower(name))
WHERE deleted_at IS NULL;

-- Tabela de Tarefas
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  life_area_id uuid NOT NULL,
  user_id uuid NOT NULL,

  title varchar(255) NOT NULL,
  description varchar(1000),

  status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  progress integer NOT NULL DEFAULT 0,
  difficulty varchar(20) NOT NULL DEFAULT 'MEDIUM',
  priority varchar(20) NOT NULL DEFAULT 'MEDIUM',

  due_date timestamptz,
  prune_reason varchar(500),
  completed_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  deleted_at timestamptz,

  CONSTRAINT tasks_id_user_id_key UNIQUE (id, user_id),

  CONSTRAINT fk_task_life_area FOREIGN KEY (life_area_id, user_id)
    REFERENCES public.life_areas(id, user_id)
    ON DELETE RESTRICT,

  CONSTRAINT chk_task_title_not_blank CHECK (
    char_length(pg_catalog.btrim(title)) BETWEEN 1 AND 255
  ),

  CONSTRAINT chk_task_description_length CHECK (
    description IS NULL OR char_length(description) <= 1000
  ),

  CONSTRAINT chk_task_status CHECK (
    status IN ('ACTIVE', 'COMPLETED', 'PRUNED')
  ),

  CONSTRAINT chk_task_difficulty CHECK (
    difficulty IN ('EASY', 'MEDIUM', 'HARD', 'VERY_HARD')
  ),

  CONSTRAINT chk_task_priority CHECK (
    priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')
  ),

  CONSTRAINT chk_task_progress CHECK (
    progress >= 0 AND progress <= 100
  ),

  CONSTRAINT chk_prune_reason_length CHECK (
    prune_reason IS NULL OR char_length(prune_reason) <= 500
  ),

  CONSTRAINT chk_task_status_coherence CHECK (
    (
      status = 'ACTIVE'
      AND completed_at IS NULL
      AND prune_reason IS NULL
    )
    OR
    (
      status = 'COMPLETED'
      AND completed_at IS NOT NULL
      AND progress = 100
      AND prune_reason IS NULL
    )
    OR
    (
      status = 'PRUNED'
      AND completed_at IS NULL
      AND prune_reason IS NOT NULL
    )
  )
);

CREATE TRIGGER tasks_updated_at_trig
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_life_areas_tasks_updated_at();

-- Índices
CREATE INDEX idx_life_areas_user_active
ON public.life_areas(user_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_tasks_user_area_active
ON public.tasks(user_id, life_area_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_tasks_user_status_active
ON public.tasks(user_id, status)
WHERE deleted_at IS NULL;

CREATE INDEX idx_tasks_life_area_status_active
ON public.tasks(life_area_id, status)
WHERE deleted_at IS NULL;

CREATE INDEX idx_tasks_completed_at
ON public.tasks(user_id, completed_at DESC)
WHERE deleted_at IS NULL AND status = 'COMPLETED';

-- Segurança: revokes
REVOKE ALL ON public.life_areas FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.tasks FROM PUBLIC, anon, authenticated;

-- Grants sem DELETE físico
GRANT SELECT, INSERT, UPDATE ON public.life_areas TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tasks TO authenticated;

-- RLS
ALTER TABLE public.life_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policies life_areas
CREATE POLICY "authenticated_select_own_life_areas"
ON public.life_areas
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "authenticated_insert_own_life_areas"
ON public.life_areas
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_update_own_life_areas"
ON public.life_areas
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies tasks
CREATE POLICY "authenticated_select_own_tasks"
ON public.tasks
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "authenticated_insert_own_tasks"
ON public.tasks
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_update_own_tasks"
ON public.tasks
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Rollback M2 — executar apenas se necessário
-- DROP POLICY IF EXISTS "authenticated_update_own_tasks" ON public.tasks;
-- DROP POLICY IF EXISTS "authenticated_insert_own_tasks" ON public.tasks;
-- DROP POLICY IF EXISTS "authenticated_select_own_tasks" ON public.tasks;
-- DROP POLICY IF EXISTS "authenticated_update_own_life_areas" ON public.life_areas;
-- DROP POLICY IF EXISTS "authenticated_insert_own_life_areas" ON public.life_areas;
-- DROP POLICY IF EXISTS "authenticated_select_own_life_areas" ON public.life_areas;
-- DROP TRIGGER IF EXISTS tasks_updated_at_trig ON public.tasks;
-- DROP TRIGGER IF EXISTS life_areas_updated_at_trig ON public.life_areas;
-- DROP INDEX IF EXISTS public.idx_tasks_completed_at;
-- DROP INDEX IF EXISTS public.idx_tasks_life_area_status_active;
-- DROP INDEX IF EXISTS public.idx_tasks_user_status_active;
-- DROP INDEX IF EXISTS public.idx_tasks_user_area_active;
-- DROP INDEX IF EXISTS public.idx_life_areas_user_active;
-- DROP INDEX IF EXISTS public.unique_active_life_area_name_per_user;
-- DROP TABLE IF EXISTS public.tasks;
-- DROP TABLE IF EXISTS public.life_areas;
-- DROP FUNCTION IF EXISTS public.set_life_areas_tasks_updated_at();
