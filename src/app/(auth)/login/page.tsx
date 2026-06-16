'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrowserClient } from '@/services/supabase/browser';
import { Card } from '@/components/ui/Card';
import { getSafeRedirectUrl } from '@/utils/redirect';

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
  const [loading, setLoading] = useState(false);

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
    if (loading) return;

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

      router.push(safeRedirect);
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card variant="glass" className="w-full shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 tracking-tight">TaskGarden</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">Cultive sua produtividade passo a passo</p>
      </div>

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
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="seuemail@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="password">
              Senha
            </label>
            <Link
              href="/esqueci-a-senha"
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl shadow-md transition-colors text-sm"
        >
          {loading ? 'Entrando...' : 'Entrar no Jardim'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        <span>Não tem uma conta? </span>
        <Link href="/cadastro" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
          Criar conta
        </Link>
      </div>
    </Card>
  );
}
