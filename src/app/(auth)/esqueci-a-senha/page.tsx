'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { sendRecoveryEmailAction } from './actions';

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(sendRecoveryEmailAction, null);

  return (
    <Card variant="glass" className="w-full shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 tracking-tight">Recuperar Senha</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">Digite seu e-mail para receber o link de redefinição</p>
      </div>

      {state?.error && (
        <div className="p-4 rounded-xl text-xs mb-6 text-center border bg-red-500/10 text-red-800 dark:text-red-300 border-red-500/20">
          ⚠️ {state.error}
        </div>
      )}

      {state?.success && (
        <div className="p-4 rounded-xl text-xs mb-6 text-center border bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20">
          🎉 {state.message}
        </div>
      )}

      <form className="space-y-4" action={formAction}>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="seuemail@exemplo.com"
            disabled={isPending}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl shadow-md transition-colors text-sm"
        >
          {isPending ? 'Enviando link...' : 'Enviar Link de Redefinição'}
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
