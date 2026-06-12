import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig } from './config';

let clientInstance: ReturnType<typeof createSupabaseBrowserClient> | null = null;

/**
 * Obtém a instância do cliente Supabase para o Browser.
 * Dispara um erro claro se as variáveis de ambiente não estiverem configuradas.
 */
export function getBrowserClient() {
  const config = getSupabaseConfig();
  
  if (!config.isConfigured) {
    throw new Error(
      "Supabase Browser Client: Variáveis de ambiente ausentes. " +
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no arquivo .env.local."
    );
  }

  if (!clientInstance) {
    clientInstance = createSupabaseBrowserClient(config.url, config.key);
  }

  return clientInstance;
}
