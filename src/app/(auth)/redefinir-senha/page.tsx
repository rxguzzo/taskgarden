'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/services/supabase/browser';
import { Card } from '@/components/ui/Card';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    // Validações básicas no cliente
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas informadas não coincidem.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const supabase = getBrowserClient();
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      setMessage({
        type: 'success',
        text: 'Sua senha foi redefinida com sucesso! Você será redirecionado para a tela de login em alguns segundos.',
      });

      // Limpar campos
      setPassword('');
      setConfirmPassword('');

      // Redireciona para o login após 3 segundos
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      console.error('Erro ao redefinir senha:', err);
      const errorObj = err as { status?: number; message?: string };
      let errorMessage = errorObj.message || 'Erro ao tentar atualizar a senha. Certifique-se de acessar o link válido de recuperação.';
      if (errorObj.status === 429) {
        errorMessage = 'Muitas tentativas de alteração recentes. Aguarde um momento.';
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
        <h1 className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 tracking-tight">Nova Senha</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">Escolha sua nova senha de acesso</p>
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
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="password">
            Nova Senha
          </label>
          <input
            id="password"
            type="password"
            required
            placeholder="No mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="confirmPassword">
            Confirmar Nova Senha
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            placeholder="Repita a nova senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !password || !confirmPassword}
          className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl shadow-md transition-colors text-sm"
        >
          {loading ? 'Redefinindo...' : 'Salvar Nova Senha'}
        </button>
      </form>
    </Card>
  );
}
