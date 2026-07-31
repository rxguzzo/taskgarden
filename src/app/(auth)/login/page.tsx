'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrowserClient } from '@/services/supabase/browser';
import { Card } from '@/components/ui/Card';
import { getSafeRedirectUrl } from '@/utils/redirect';
import { TreeLoading } from '@/components/ui/TreeLoading';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Card variant="glass" className="w-full shadow-lg flex items-center justify-center p-12">
        <div className="text-center text-sm text-zinc-500">
          <svg className="animate-spin h-5 w-5 mx-auto text-emerald-600 mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Carregando formulário...
        </div>
      </Card>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Inicializar mensagem com base no parâmetro da URL de forma síncrona
  const getInitialMessage = () => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'code_missing') {
      return { type: 'error' as const, text: 'O código de confirmação está ausente. Tente fazer login.' };
    }
    if (errorParam === 'exchange_failed') {
      return { type: 'error' as const, text: 'Não foi possível validar seu link de confirmação. O link pode ter expirado.' };
    }
    if (errorParam === 'auth_callback_failed') {
      return { type: 'error' as const, text: 'Falha na autenticação. Tente novamente.' };
    }
    return null;
  };

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(getInitialMessage);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading || isRedirecting) return;

    // Validações básicas de campos
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setMessage({ type: 'error', text: 'O e-mail é obrigatório.' });
      return;
    }
    if (!password) {
      setMessage({ type: 'error', text: 'A senha é obrigatória.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    let redirecting = false;
    try {
      const supabase = getBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        throw error;
      }

      // Redirecionamento seguro para o destino original ou fallback para /garden
      const nextParam = searchParams.get('next');
      const safeRedirect = getSafeRedirectUrl(nextParam, '/garden');

      redirecting = true;
      setIsRedirecting(true);
      router.replace(safeRedirect);
    } catch (err: unknown) {
      console.error('Erro no login:', err);
      let errorMessage = 'E-mail ou senha incorretos. Verifique suas credenciais.';

      const errorObj = err as { status?: number; message?: string };
      if (errorObj?.status === 429) {
        errorMessage = 'Muitas tentativas sem sucesso. Aguarde um momento antes de tentar novamente.';
      } else if (errorObj?.message) {
        const msg = errorObj.message.toLowerCase();
        if (msg.includes('email not confirmed')) {
          errorMessage = 'Seu e-mail ainda não foi confirmado. Por favor, verifique sua caixa de entrada e spam para confirmar sua conta.';
        } else if (msg.includes('invalid grant') || msg.includes('invalid credentials')) {
          errorMessage = 'E-mail ou senha inválidos. Por favor, tente novamente.';
        } else {
          errorMessage = errorObj.message;
        }
      }

      setMessage({
        type: 'error',
        text: errorMessage,
      });
      setIsRedirecting(false);
      setLoading(false);
    } finally {
      if (!redirecting) {
        setLoading(false);
      }
    }
  }

  const isFormDisabled = loading || isRedirecting;

  return (
    <div className="relative">
      {/* Overlay de Redirecionamento Ativo */}
      {isRedirecting && (
        <TreeLoading variant="overlay" label="Entrando no jardim..." />
      )}

      {message && (
        <div className={`p-4 rounded-xl text-xs mb-6 text-center border ${
          message.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
            : 'bg-red-500/10 text-red-800 dark:text-red-300 border-red-500/20'
        }`}>
          {message.text}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide" htmlFor="email">
            E-mail
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400 dark:text-zinc-550">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </span>
            <input
              id="email"
              type="email"
              required
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isFormDisabled}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide" htmlFor="password">
              Senha
            </label>
            <Link
              href="/esqueci-a-senha"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400 dark:text-zinc-550">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isFormDisabled}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isFormDisabled}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-350 cursor-pointer"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isFormDisabled || !email || !password}
          className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-colors text-sm flex items-center justify-center gap-1.5 min-h-[48px] cursor-pointer"
        >
          {loading ? (
            <TreeLoading label="Entrando..." size="sm" />
          ) : (
            <>
              Entrar
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                <path d="M2 22C6 18 12 17 17 12C22 7 21 2 21 2C21 2 16 3 11 8C6 13 5 19 2 22Z" />
              </svg>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-zinc-550 dark:text-zinc-400 font-semibold select-none">
        <span>Ainda não tem uma conta? </span>
        <Link href="/cadastro" className="text-emerald-600 dark:text-emerald-450 font-bold hover:underline">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
