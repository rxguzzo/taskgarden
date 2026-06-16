'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/services/supabase/server';

export interface ActionState {
  success: boolean;
  error?: string;
  message?: string;
}

// Lista básica de fusos horários IANA aceitos para validação no servidor
const VALID_IANAS = new Set([
  'America/Sao_Paulo', 'America/Noronha', 'America/Belem', 'America/Fortaleza',
  'America/Recife', 'America/Araguaina', 'America/Maceio', 'America/Bahia',
  'America/Rio_Branco', 'America/Manaus', 'America/Porto_Velho', 'America/Boa_Vista',
  'America/Cuiaba', 'America/Campo_Grande', 'America/Santiago', 'America/Bogota',
  'America/New_York', 'America/Los_Angeles', 'America/Chicago', 'America/Denver',
  'America/Mexico_City', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Europe/Rome', 'Europe/Madrid', 'Europe/Lisbon', 'Asia/Tokyo', 'Asia/Shanghai',
  'Asia/Kolkata', 'UTC', 'GMT'
]);

/**
 * Server Action para atualização do perfil do usuário utilizando useActionState.
 */
export async function updateProfileAction(
  _previousState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const displayName = formData.get('display_name')?.toString();
    const avatarUrl = formData.get('avatar_url')?.toString();
    const timezone = formData.get('timezone')?.toString();

    // 1. Validação de display_name: obrigatório, trim, max 100
    const cleanName = displayName ? displayName.trim() : '';
    if (!cleanName) {
      return { success: false, error: 'O nome de exibição é obrigatório.' };
    }
    if (cleanName.length > 100) {
      return { success: false, error: 'O nome de exibição deve ter no máximo 100 caracteres.' };
    }

    // 2. Validação de timezone: obrigatório, max 100, valor IANA válido
    const cleanTimezone = timezone ? timezone.trim() : '';
    if (!cleanTimezone) {
      return { success: false, error: 'O fuso horário é obrigatório.' };
    }
    if (cleanTimezone.length > 100) {
      return { success: false, error: 'O fuso horário deve ter no máximo 100 caracteres.' };
    }
    if (!VALID_IANAS.has(cleanTimezone)) {
      // Caso não esteja na lista explícita básica, tenta verificar com Intl
      try {
        Intl.DateTimeFormat(undefined, { timeZone: cleanTimezone });
      } catch {
        return { success: false, error: 'Fuso horário inválido. Selecione um formato IANA válido.' };
      }
    }

    // 3. Validação de avatar_url: opcional, máximo 2048, somente HTTP/HTTPS
    let cleanAvatar: string | null = null;
    if (avatarUrl && avatarUrl.trim()) {
      const trimmedAvatar = avatarUrl.trim();
      if (trimmedAvatar.length > 2048) {
        return { success: false, error: 'O link do avatar deve ter no máximo 2048 caracteres.' };
      }
      if (!/^https?:\/\//i.test(trimmedAvatar)) {
        return { success: false, error: 'O link do avatar deve começar com http:// ou https://.' };
      }
      cleanAvatar = trimmedAvatar;
    }

    // 4. Conexão ao Supabase e validação de sessão
    const supabase = await getServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Sessão expirada. Por favor, faça login novamente.' };
    }

    // 5. Atualização no banco apenas para colunas autorizadas
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: cleanName,
        avatar_url: cleanAvatar,
        timezone: cleanTimezone,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Erro de banco de dados na atualização de perfil:', updateError);
      return { success: false, error: 'Não foi possível atualizar o perfil. Ocorreu um erro no servidor.' };
    }

    // 6. Revalidação de caminhos reais solicitados
    revalidatePath('/garden', 'layout');
    revalidatePath('/settings');

    return { success: true, message: 'Perfil atualizado com sucesso!' };
  } catch (err) {
    console.error('Erro na action updateProfileAction:', err);
    return { success: false, error: 'Erro inesperado ao salvar alterações. Tente novamente.' };
  }
}

/**
 * Server Action para encerramento de sessão de forma segura.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await getServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}
