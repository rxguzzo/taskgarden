'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '../../../components/ui/Card';

export default function LoginPage() {
  return (
    <Card variant="glass" className="w-full shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 tracking-tight">TaskGarden</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">Cultive sua produtividade passo a passo</p>
      </div>

      <div className="bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 p-3 rounded-xl text-xs mb-6 text-center border border-emerald-500/20">
        🔑 **Nota do MVP**: A autenticação funcional está desabilitada nesta fase estrutural. Clique em &quot;Entrar&quot; para navegar diretamente ao painel.
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            placeholder="seuemail@exemplo.com"
            disabled
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 opacity-60 cursor-not-allowed text-sm focus:outline-none"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="password">
              Senha
            </label>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 cursor-not-allowed">Esqueceu a senha?</span>
          </div>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            disabled
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 opacity-60 cursor-not-allowed text-sm focus:outline-none"
          />
        </div>

        <Link
          href="/garden"
          className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl shadow-md transition-colors text-sm"
        >
          Entrar no Jardim
        </Link>
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
