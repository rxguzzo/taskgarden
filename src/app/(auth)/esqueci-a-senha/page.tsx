'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getBrowserClient } from '@/services/supabase/browser';
import { Card } from '@/components/ui/Card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !email) return;

    setLoading(true);
    setMessage(null);

    try {
      const supabase = getBrowserClient();
      // O redirectUrl de redefinição usa o fluxo PKCE
      const redirectUrl = `${window.location.origin}/auth/callback?next=/redefinir-senha`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      setMessage({
        type: 'success',
        text: 'Instruções enviadas! Se o e-mail estiver cadastrado, você receberá um link de recuperação em instantes. Verifique também a pasta de spam.',
      });
      setEmail('');
    } catch (err: unknown) {
      console.error('Erro ao solicitar recuperação de senha:', err);
      const errorObj = err as { status?: number; message?: string };
      let errorMessage = errorObj.message || 'Erro ao tentar enviar o e-mail de recuperação.';
      if (errorObj.status === 429) {
        errorMessage = 'Muitas solicitações recentes. Aguarde alguns minutos antes de tentar novamente.';
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
        <h1 className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 tracking-tight">Recuperar Senha</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">Digite seu e-mail para receber o link de redefinição</p>
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

      <form className="space-y-4" onSubmit={handleSubmit}>
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

        <button
          type="submit"
          disabled={loading || !email}
          className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl shadow-md transition-colors text-sm"
        >
          {loading ? 'Enviando link...' : 'Enviar Link de Redefinição'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/login" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
          Voltar para o login
        </Link>
      </div>
    </Card>
  );
}
