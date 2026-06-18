-- Módulo 5 — Subtarefas e Progresso Automático

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Criação da Tabela de Subtarefas
CREATE TABLE public.subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL,
  life_area_id uuid NOT NULL,
  title varchar(255) NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  deleted_at timestamptz,

  -- Constraints
  CONSTRAINT chk_subtask_title CHECK (char_length(pg_catalog.btrim(title)) BETWEEN 1 AND 255),
  CONSTRAINT chk_subtask_sort_order CHECK (sort_order >= 0),

  -- Chaves Compostas para garantir integridade e posse do mesmo usuário
  CONSTRAINT fk_subtask_task FOREIGN KEY (task_id, user_id)
    REFERENCES public.tasks(id, user_id)
    ON DELETE RESTRICT,

  CONSTRAINT fk_subtask_life_area FOREIGN KEY (life_area_id, user_id)
    REFERENCES public.life_areas(id, user_id)
    ON DELETE RESTRICT
);

-- 2. Trigger para atualizar updated_at automaticamente (Reusando função existente)
CREATE TRIGGER subtasks_updated_at_trig
BEFORE UPDATE ON public.subtasks
FOR EACH ROW
EXECUTE FUNCTION public.set_life_areas_tasks_updated_at();

-- 3. Trigger e Função de Validação de Regras de Negócio (SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.check_subtask_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_task_status varchar(20);
  v_task_deleted_at timestamptz;
  v_task_life_area_id uuid;
  v_area_deleted_at timestamptz;
BEGIN
  -- Bloquear alteração de subtarefas já excluídas logicamente
  IF TG_OP = 'UPDATE' AND OLD.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Não é permitido alterar uma subtarefa já excluída.';
  END IF;

  -- 1. Buscar status, soft delete e life_area_id da tarefa correspondente
  SELECT status, deleted_at, life_area_id INTO v_task_status, v_task_deleted_at, v_task_life_area_id
  FROM public.tasks
  WHERE id = NEW.task_id AND user_id = NEW.user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tarefa inválida ou pertencente a outro usuário.';
  END IF;

  -- 2. Buscar soft delete da área da vida correspondente
  SELECT deleted_at INTO v_area_deleted_at
  FROM public.life_areas
  WHERE id = NEW.life_area_id AND user_id = NEW.user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Área da vida inválida ou pertencente a outro usuário.';
  END IF;

  -- 3. Validações de integridade
  IF v_task_deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Não é permitido gerenciar subtarefas em uma tarefa excluída.';
  END IF;

  IF v_area_deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Não é permitido gerenciar subtarefas em uma área da vida arquivada/excluída.';
  END IF;

  IF v_task_status = 'PRUNED' THEN
    RAISE EXCEPTION 'Não é permitido gerenciar subtarefas em uma tarefa podada.';
  END IF;

  IF v_task_status = 'COMPLETED' THEN
    RAISE EXCEPTION 'Não é permitido alterar subtarefas de uma tarefa já concluída.';
  END IF;

  IF v_task_life_area_id <> NEW.life_area_id THEN
    RAISE EXCEPTION 'A tarefa não pertence à área da vida informada.';
  END IF;

  -- 4. Se for um soft-delete (atualizando deleted_at para não-nulo)
  IF NEW.deleted_at IS NOT NULL THEN
    IF TG_OP = 'UPDATE' THEN
      -- Impedir a alteração de qualquer dado histórico/estrutural ou de conclusão durante a exclusão
      IF NEW.task_id <> OLD.task_id OR
         NEW.life_area_id <> OLD.life_area_id OR
         NEW.user_id <> OLD.user_id OR
         NEW.title <> OLD.title OR
         NEW.sort_order <> OLD.sort_order OR
         NEW.is_completed <> OLD.is_completed OR
         NEW.completed_at IS DISTINCT FROM OLD.completed_at THEN
        RAISE EXCEPTION 'Não é permitido alterar os dados estruturais ou estado de conclusão da subtarefa durante a exclusão.';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- 5. Definir completed_at automaticamente se is_completed mudou (inserts/updates normais)
  IF NEW.is_completed THEN
    IF TG_OP = 'INSERT' OR OLD.is_completed = false THEN
      NEW.completed_at = pg_catalog.now();
    END IF;
  ELSE
    NEW.completed_at = NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER subtasks_integrity_trig
BEFORE INSERT OR UPDATE ON public.subtasks
FOR EACH ROW
EXECUTE FUNCTION public.check_subtask_integrity();

-- 4. Otimização e Índices de Busca
CREATE INDEX idx_subtasks_user_active
ON public.subtasks(user_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_subtasks_task_active
ON public.subtasks(task_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_subtasks_life_area_active
ON public.subtasks(life_area_id)
WHERE deleted_at IS NULL;

-- 5. Revogação de Acesso para Roles Públicas
REVOKE ALL ON public.subtasks FROM PUBLIC, anon, authenticated;

-- 6. Concessão de Privilégios Mínimos à Role Authenticated
GRANT SELECT, INSERT, UPDATE ON public.subtasks TO authenticated;

-- 7. Políticas de Segurança (Row Level Security)
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_own_subtasks"
ON public.subtasks
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "authenticated_insert_own_subtasks"
ON public.subtasks
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_update_own_subtasks"
ON public.subtasks
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Rollback M5 — executar apenas se necessário
-- DROP POLICY IF EXISTS "authenticated_update_own_subtasks" ON public.subtasks;
-- DROP POLICY IF EXISTS "authenticated_insert_own_subtasks" ON public.subtasks;
-- DROP POLICY IF EXISTS "authenticated_select_own_subtasks" ON public.subtasks;
-- DROP TRIGGER IF EXISTS subtasks_integrity_trig ON public.subtasks;
-- DROP TRIGGER IF EXISTS subtasks_updated_at_trig ON public.subtasks;
-- DROP FUNCTION IF EXISTS public.check_subtask_integrity();
-- DROP INDEX IF EXISTS public.idx_subtasks_life_area_active;
-- DROP INDEX IF EXISTS public.idx_subtasks_task_active;
-- DROP INDEX IF EXISTS public.idx_subtasks_user_active;
-- DROP TABLE IF EXISTS public.subtasks;
