'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/services/supabase/browser';
import { Card } from '@/components/ui/Card';
import { TreeLoading } from '@/components/ui/TreeLoading';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || isRedirecting) return;

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

    let redirecting = false;
    try {
      const supabase = getBrowserClient();
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      redirecting = true;
      setIsRedirecting(true);

      setMessage({
        type: 'success',
        text: 'Senha redefinida com sucesso. Redirecionando para o seu jardim...',
      });

      // Limpar campos
      setPassword('');
      setConfirmPassword('');

      // Redireciona para o painel /garden após 2 segundos
      setTimeout(() => {
        router.push('/garden');
      }, 2000);
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
    <Card variant="glass" className="w-full shadow-lg relative">
      {/* Overlay de Redirecionamento Ativo */}
      {isRedirecting && (
        <TreeLoading variant="overlay" label="Senha redefinida com sucesso. Redirecionando para o seu jardim..." />
      )}

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
            disabled={isFormDisabled}
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
            disabled={isFormDisabled}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={isFormDisabled || !password || !confirmPassword}
          className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl shadow-md transition-colors text-sm flex items-center justify-center min-h-[48px]"
        >
          {loading ? (
            <TreeLoading label="Redefinindo..." size="sm" />
          ) : (
            'Salvar Nova Senha'
          )}
        </button>
      </form>
    </Card>
  );
}
