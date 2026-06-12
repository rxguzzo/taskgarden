import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseConfig } from './config';

/**
 * Obtém a instância do cliente Supabase para o Servidor (Server Components, Route Handlers, Server Actions).
 * Dispara um erro claro se as variáveis de ambiente não estiverem configuradas.
 */
export async function getServerClient() {
  const config = getSupabaseConfig();
  
  if (!config.isConfigured) {
    throw new Error(
      "Supabase Server Client: Variáveis de ambiente ausentes. " +
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no arquivo .env.local."
    );
  }

  const cookieStore = await cookies();

  return createSupabaseServerClient(
    config.url,
    config.key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Este bloco captura erros caso setAll seja chamado em Server Components
            // que apenas leem dados, o que é esperado no comportamento do Next.js
          }
        },
      },
    }
  );
}
