-- Módulo 10.2 — Conclusão de Rotinas por Período

-- 1. Atualizar a constraint de frequências permitidas na tabela public.habits
ALTER TABLE public.habits DROP CONSTRAINT chk_habit_frequency;
ALTER TABLE public.habits ADD CONSTRAINT chk_habit_frequency CHECK (frequency IN ('DAILY', 'WEEKDAYS', 'CUSTOM_WEEKLY', 'WEEKLY', 'MONTHLY'));

-- 2. Adicionar as novas colunas à tabela public.habit_completions
ALTER TABLE public.habit_completions ADD COLUMN period_type varchar(20) DEFAULT 'DAY';
ALTER TABLE public.habit_completions ADD COLUMN period_key varchar(20);

-- 3. Popular os registros existentes com valores baseados no completed_date histórico
UPDATE public.habit_completions
SET 
  period_type = 'DAY',
  period_key = to_char(completed_date, 'YYYY-MM-DD');

-- 4. Definir as colunas como NOT NULL após populá-las
ALTER TABLE public.habit_completions ALTER COLUMN period_type SET NOT NULL;
ALTER TABLE public.habit_completions ALTER COLUMN period_key SET NOT NULL;

-- 5. Adicionar a constraint de check para period_type
ALTER TABLE public.habit_completions ADD CONSTRAINT chk_completion_period_type CHECK (period_type IN ('DAY', 'WEEK', 'MONTH'));

-- 6. Remover a restrição única antiga de data simples
ALTER TABLE public.habit_completions DROP CONSTRAINT unique_habit_user_date_completion;

-- 7. Adicionar a nova restrição única composta por período
ALTER TABLE public.habit_completions ADD CONSTRAINT unique_habit_user_period UNIQUE (habit_id, user_id, period_type, period_key);

-- 8. Adicionar índice otimizado para buscas baseadas em períodos
CREATE INDEX idx_habit_completions_user_period
ON public.habit_completions(user_id, period_key);
