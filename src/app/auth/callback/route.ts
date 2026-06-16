import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerClient } from '@/services/supabase/server';
import { getSafeRedirectUrl } from '@/utils/redirect';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/garden';

  // Validar o destino usando o utilitário seguro contra open redirect
  const safeNext = getSafeRedirectUrl(next, '/garden');

  if (!code) {
    // Redireciona para login indicando que o código PKCE está ausente
    return NextResponse.redirect(new URL('/login?error=code_missing', request.url));
  }

  try {
    const supabase = await getServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      throw error;
    }

    // Criar resposta de redirecionamento para o destino seguro
    const response = NextResponse.redirect(new URL(safeNext, request.url));

    // O getServerClient do Supabase SSR manipula automaticamente os cookies do cookieStore
    // (via cookies() do next/headers), de modo que a sessão já estará salva.
    return response;
  } catch (err) {
    console.error('Erro no callback de autenticação PKCE:', err);
    return NextResponse.redirect(
      new URL('/login?error=exchange_failed', request.url)
    );
  }
}
