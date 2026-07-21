'use server';

import { headers } from 'next/headers';
import { getServerClient } from '../../../services/supabase/server';

export async function sendRecoveryEmailAction(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  if (!email || !email.trim()) {
    return { error: 'O e-mail é obrigatório.' };
  }

  try {
    const supabase = await getServerClient();
    
    // Obter o origin dinamicamente no servidor
    const headersList = await headers();
    const origin = headersList.get('origin') ?? 
                   process.env.NEXT_PUBLIC_SITE_URL ?? 
                   'http://localhost:3000';

    const redirectTo = `${origin}/auth/callback?next=/redefinir-senha`;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (error) {
      return { error: error.message };
    }

    return { 
      success: true, 
      message: 'Instruções enviadas! Se o e-mail estiver cadastrado, você receberá um link de recuperação em instantes. Verifique também a pasta de spam.' 
    };
  } catch (err: unknown) {
    console.error('Erro na action de recuperação de senha:', err);
    const message = err instanceof Error ? err.message : 'Erro ao processar a solicitação.';
    return { error: message };
  }
}
