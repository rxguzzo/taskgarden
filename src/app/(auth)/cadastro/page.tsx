'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/services/supabase/browser';
import { Card } from '@/components/ui/Card';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    // Validações básicas no frontend
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      setMessage({ type: 'error', text: 'O nome completo é obrigatório.' });
      return;
    }
    if (!trimmedEmail) {
      setMessage({ type: 'error', text: 'O e-mail é obrigatório.' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve conter no mínimo 6 caracteres.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const supabase = getBrowserClient();
      const redirectUrl = `${window.location.origin}/auth/callback?next=/garden`;

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: trimmedName,
          },
        },
      });

      if (error) {
        throw error;
      }

      // Tratar os dois cenários: confirmação ativa ou inativa
      if (data.session) {
        // Confirmação inativa - logado imediatamente
        router.push('/garden');
      } else if (data.user) {
        // Confirmação ativa - aguardando verificação
        setMessage({
          type: 'success',
          text: 'Cadastro realizado com sucesso! Enviamos um link de confirmação para o seu e-mail. Por favor, verifique sua caixa de entrada e a pasta de spam.',
        });
        // Limpar os campos do formulário para evitar envios duplicados
        setName('');
        setEmail('');
        setPassword('');
      } else {
        throw new Error('Falha ao criar conta. Tente novamente.');
      }
    } catch (err: unknown) {
      console.error('Erro no cadastro:', err);
      let errorMessage = 'Erro ao conectar com o servidor. Verifique sua conexão de rede.';

      const errorObj = err as { status?: number; message?: string };
      if (errorObj?.status === 429) {
        errorMessage = 'Muitas tentativas em pouco tempo. Por favor, aguarde alguns minutos antes de tentar novamente.';
      } else if (errorObj?.message) {
        const msg = errorObj.message.toLowerCase();
        if (msg.includes('user already registered') || msg.includes('already exists')) {
          errorMessage = 'Este e-mail já está em uso por outra conta. Tente fazer login ou escolha outro e-mail.';
        } else if (msg.includes('password') && msg.includes('weak')) {
          errorMessage = 'A senha informada é fraca. Escolha uma senha mais segura com pelo menos 6 caracteres.';
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
        <h1 className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 tracking-tight">Criar Conta</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">Comece a plantar seus objetivos hoje mesmo</p>
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

      <form className="space-y-4" onSubmit={handleRegister}>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="name">
            Nome Completo
          </label>
          <input
            id="name"
            type="text"
            required
            placeholder="Como quer ser chamado?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

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
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email || !password || !name}
          className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl shadow-md transition-colors text-sm"
        >
          {loading ? 'Criando conta...' : 'Registrar e Ir ao Jardim'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        <span>Já possui uma conta? </span>
        <Link href="/login" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
          Fazer login
        </Link>
      </div>
    </Card>
  );
}
