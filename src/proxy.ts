import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSafeRedirectUrl } from './utils/redirect';

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();

  // 1. Mapeamento e identificação das rotas
  const isDashboardRoute = url.pathname.startsWith('/garden') ||
                           url.pathname.startsWith('/greenhouse') ||
                           url.pathname.startsWith('/focus') ||
                           url.pathname.startsWith('/statistics') ||
                           url.pathname.startsWith('/settings') ||
                           url.pathname.startsWith('/tasks');

  const isVisitorAuthRoute = url.pathname.startsWith('/login') ||
                             url.pathname.startsWith('/cadastro') ||
                             url.pathname.startsWith('/esqueci-a-senha');

  const isRecoveryRoute = url.pathname.startsWith('/redefinir-senha');

  // 2. Validação das variáveis de ambiente com comportamento Fail-Closed
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
  const isConfigured = supabaseUrl.trim().length > 0 && supabaseKey.trim().length > 0;

  if (!isConfigured) {
    if (process.env.NODE_ENV === 'development') {
      throw new Error(
        "Supabase environment variables are missing. " +
        "Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local."
      );
    } else {
      // Em produção, bloqueia acesso a rotas privadas ou que exigem processamento
      if (isDashboardRoute || isVisitorAuthRoute || isRecoveryRoute || url.pathname === '/') {
        return new NextResponse(
          'Erro de Configuração: Acesso bloqueado devido à ausência das variáveis de segurança.',
          { status: 500 }
        );
      }
      return NextResponse.next();
    }
  }

  // 3. Inicialização do Cliente Supabase SSR
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // 4. Validação segura de identidade usando getUser()
  const { data: { user } } = await supabase.auth.getUser();

  // 5. Lógica de Redirecionamentos e Proteção
  if (isDashboardRoute && !user) {
    // Redireciona para login salvando o destino de forma segura
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';

    const safeNext = getSafeRedirectUrl(url.pathname + url.search, '/garden');
    redirectUrl.searchParams.set('next', safeNext);

    const redirectResponse = NextResponse.redirect(redirectUrl);
    // Preserva cookies gerados pelo Supabase SSR na resposta de redirect
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        maxAge: cookie.maxAge,
      });
    });
    return redirectResponse;
  }

  if (isVisitorAuthRoute && user) {
    // Visitante logado tentando ir para login/cadastro -> vai para /garden
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/garden';
    redirectUrl.searchParams.delete('next');

    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        maxAge: cookie.maxAge,
      });
    });
    return redirectResponse;
  }

  // Nota: A rota /redefinir-senha NÃO redireciona para /garden se houver sessão,
  // permitindo que o usuário redefina a senha mesmo logado ou com token de recovery.

  return response;
}

export const config = {
  matcher: [
    /*
     * Matcher que intercepta todas as rotas de páginas e API, exceto exclusões:
     * - _next/static (arquivos estáticos de build)
     * - _next/image (imagens otimizadas)
     * - favicon.ico (ícone do navegador)
     * - Imagens (.png, .jpg, .jpeg, .gif, .webp, .svg)
     * - Fontes (.woff, .woff2, .ttf, .eot)
     * - Arquivos públicos estáticos em geral (.css, .js)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
