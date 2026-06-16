-- 1. Criação do trigger genérico de updated_at para o módulo de perfis
CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = pg_catalog.now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

REVOKE EXECUTE ON FUNCTION public.set_profiles_updated_at() FROM PUBLIC, anon, authenticated;

-- 2. Tabela de Perfis com constraints e tipos adequados
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    avatar_url VARCHAR(2048),
    timezone VARCHAR(100) NOT NULL DEFAULT 'America/Sao_Paulo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

-- Ativação do trigger de updated_at
CREATE TRIGGER profiles_updated_at_trig
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_profiles_updated_at();

-- 3. Habilitação do Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Função handle_new_user (SECURITY DEFINER, search_path = '', sem captura global de exceção)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    raw_name TEXT;
    cleaned_name VARCHAR(100);
BEGIN
    -- Obter o nome dos metadados de forma qualificada
    raw_name := pg_catalog.coalesce(
        new.raw_user_meta_data->>'name',
        ''
    );

    -- Limpar espaços
    raw_name := pg_catalog.trim(raw_name);

    -- Tratar nome ausente ou vazio
    IF raw_name = '' THEN
        -- Fallback 1: Prefixo do email
        raw_name := pg_catalog.split_part(new.email, '@', 1);
        raw_name := pg_catalog.trim(raw_name);

        -- Fallback final
        IF raw_name = '' OR raw_name IS NULL THEN
            raw_name := 'Jardineiro';
        END IF;
    END IF;

    -- Cortar se for maior que 100 caracteres
    cleaned_name := pg_catalog.substring(raw_name FROM 1 FOR 100);

    -- Inserir perfil com ON CONFLICT DO NOTHING
    INSERT INTO public.profiles (id, display_name, timezone)
    VALUES (new.id, cleaned_name, 'America/Sao_Paulo')
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Revogar EXECUTE da função handle_new_user de PUBLIC, anon e authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Trigger em auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Backfill idempotente de usuários existentes que não possuem perfil
INSERT INTO public.profiles (id, display_name, timezone)
SELECT
    u.id,
    pg_catalog.substring(
        pg_catalog.trim(
            pg_catalog.coalesce(
                u.raw_user_meta_data->>'name',
                pg_catalog.coalesce(
                    pg_catalog.nullif(pg_catalog.split_part(u.email, '@', 1), ''),
                    'Jardineiro'
                )
            )
        ) FROM 1 FOR 100
    ),
    'America/Sao_Paulo'
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 6. Privilégios de Acesso e Colunas
REVOKE ALL ON public.profiles FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.profiles TO authenticated;

-- Permite atualizar apenas as colunas display_name, avatar_url e timezone
GRANT UPDATE (display_name, avatar_url, timezone)
ON public.profiles TO authenticated;

-- 7. Políticas RLS
CREATE POLICY "authenticated_select_own_profile" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "authenticated_update_own_profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
