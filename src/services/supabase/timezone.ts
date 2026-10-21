import { getServerClient } from './server';
import { DEFAULT_TIMEZONE } from '../../utils/date';

type ServerClient = Awaited<ReturnType<typeof getServerClient>>;

/**
 * Fuso horário salvo no perfil do usuário (Configurações).
 * Usado no servidor para saber qual é o "hoje" do usuário.
 */
export async function getUserTimezone(supabase: ServerClient, userId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .maybeSingle();

  return data?.timezone || DEFAULT_TIMEZONE;
}
