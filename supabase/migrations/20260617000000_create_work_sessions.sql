-- Módulo 3 — Sessões de Trabalho e Tempo Real Dedicado

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Criação da Tabela de Sessões de Trabalho
CREATE TABLE public.work_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL,
  life_area_id uuid NOT NULL,
  duration_minutes integer NOT NULL,
  worked_at date NOT NULL DEFAULT CURRENT_DATE,
  note varchar(1000),
  source varchar(50) NOT NULL DEFAULT 'MANUAL',
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  deleted_at timestamptz,

  -- Constraints de Integridade e Valores
  CONSTRAINT chk_work_session_duration CHECK (duration_minutes > 0 AND duration_minutes <= 720),
  CONSTRAINT chk_work_session_note_length CHECK (note IS NULL OR char_length(note) <= 1000),
  CONSTRAINT chk_work_session_source CHECK (source IN ('MANUAL', 'TIMER', 'CALENDAR_CONFIRMED')),

  -- Chaves Compostas: Garante integridade de escopo e que pertençam ao mesmo usuário
  CONSTRAINT fk_work_session_task FOREIGN KEY (task_id, user_id)
    REFERENCES public.tasks(id, user_id)
    ON DELETE RESTRICT,

  CONSTRAINT fk_work_session_life_area FOREIGN KEY (life_area_id, user_id)
    REFERENCES public.life_areas(id, user_id)
    ON DELETE RESTRICT
);

-- 2. Trigger para atualizar updated_at automaticamente
CREATE TRIGGER work_sessions_updated_at_trig
BEFORE UPDATE ON public.work_sessions
FOR EACH ROW
EXECUTE FUNCTION public.set_life_areas_tasks_updated_at();

-- 3. Trigger e Função de Validação de Regras de Negócio (SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.check_work_session_integrity()
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
  -- Se for um soft-delete (atualizando deleted_at para não-nulo)
  IF NEW.deleted_at IS NOT NULL THEN
    IF TG_OP = 'UPDATE' THEN
      -- Impedir a alteração de qualquer dado histórico/estrutural durante a exclusão
      IF NEW.task_id <> OLD.task_id OR
         NEW.life_area_id <> OLD.life_area_id OR
         NEW.duration_minutes <> OLD.duration_minutes OR
         NEW.user_id <> OLD.user_id OR
         NEW.worked_at <> OLD.worked_at OR
         NEW.source <> OLD.source THEN
        RAISE EXCEPTION 'Não é permitido alterar os dados estruturais da sessão de trabalho durante a exclusão.';
      END IF;
    END IF;
    RETURN NEW;
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
    RAISE EXCEPTION 'Não é permitido registrar tempo em uma tarefa excluída.';
  END IF;

  IF v_area_deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Não é permitido registrar tempo em uma área da vida arquivada/excluída.';
  END IF;

  IF v_task_status = 'PRUNED' THEN
    RAISE EXCEPTION 'Não é permitido registrar tempo em uma tarefa podada.';
  END IF;

  IF v_task_life_area_id <> NEW.life_area_id THEN
    RAISE EXCEPTION 'A tarefa não pertence à área da vida informada.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER work_sessions_integrity_trig
BEFORE INSERT OR UPDATE ON public.work_sessions
FOR EACH ROW
EXECUTE FUNCTION public.check_work_session_integrity();

-- 4. Otimização e Índices de Busca
CREATE INDEX idx_work_sessions_user_active
ON public.work_sessions(user_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_work_sessions_task_active
ON public.work_sessions(task_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_work_sessions_life_area_active
ON public.work_sessions(life_area_id)
WHERE deleted_at IS NULL;

-- 5. Revogação de Acesso para Roles Públicas
REVOKE ALL ON public.work_sessions FROM PUBLIC, anon, authenticated;

-- 6. Concessão de Privilégios Mínimos à Role Authenticated
GRANT SELECT, INSERT, UPDATE ON public.work_sessions TO authenticated;

-- 7. Políticas de Segurança (Row Level Security)
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_own_sessions"
ON public.work_sessions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "authenticated_insert_own_sessions"
ON public.work_sessions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_update_own_sessions"
ON public.work_sessions
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
