-- Módulo 10.4 — Eventos Pontuais na Agenda

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Criação da Tabela de Eventos (life_area_events)
CREATE TABLE public.life_area_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  life_area_id uuid NOT NULL,
  
  title varchar(255) NOT NULL,
  description varchar(1000),
  
  event_date date NOT NULL,
  event_time time, -- opcional
  status varchar(20) NOT NULL DEFAULT 'PENDING',
  
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  deleted_at timestamptz,

  -- Constraints de Integridade e Posse Composta
  CONSTRAINT life_area_events_id_user_id_key UNIQUE (id, user_id),
  
  CONSTRAINT fk_event_life_area FOREIGN KEY (life_area_id, user_id)
    REFERENCES public.life_areas(id, user_id)
    ON DELETE RESTRICT,
    
  CONSTRAINT chk_event_title CHECK (char_length(pg_catalog.btrim(title)) BETWEEN 1 AND 255),
  
  CONSTRAINT chk_event_description CHECK (description IS NULL OR char_length(description) <= 1000),
  
  CONSTRAINT chk_event_status CHECK (status IN ('PENDING', 'COMPLETED', 'ARCHIVED'))
);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER life_area_events_updated_at_trig
BEFORE UPDATE ON public.life_area_events
FOR EACH ROW
EXECUTE FUNCTION public.set_life_areas_tasks_updated_at();

-- 2. Otimização e Índices de Busca
CREATE INDEX idx_events_user_active
ON public.life_area_events(user_id, event_date)
WHERE deleted_at IS NULL;

CREATE INDEX idx_events_life_area
ON public.life_area_events(life_area_id)
WHERE deleted_at IS NULL;

-- 3. Revogação de Acesso para Roles Públicas
REVOKE ALL ON public.life_area_events FROM PUBLIC, anon, authenticated;

-- 4. Concessão de Privilégios Mínimos à Role Authenticated
GRANT SELECT, INSERT, UPDATE ON public.life_area_events TO authenticated;

-- 5. Políticas de Segurança (Row Level Security)
ALTER TABLE public.life_area_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_own_events"
ON public.life_area_events
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "authenticated_insert_own_events"
ON public.life_area_events
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_update_own_events"
ON public.life_area_events
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
