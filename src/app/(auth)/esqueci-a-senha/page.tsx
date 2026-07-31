'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { sendRecoveryEmailAction } from './actions';

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(sendRecoveryEmailAction, null);

  return (
    <div className="relative">
      <div className="mb-6 select-none">
        <h3 className="text-lg font-black text-zinc-800 dark:text-white tracking-tight">Recuperar Senha</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Digite seu e-mail para receber o link de redefinição</p>
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
              name="email"
              type="email"
              required
              placeholder="seuemail@exemplo.com"
              disabled={isPending}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-colors text-sm flex items-center justify-center gap-1.5 min-h-[48px] cursor-pointer"
        >
          {isPending ? (
            'Enviando link...'
          ) : (
            <>
              Enviar Link de Redefinição
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                <path d="M2 22C6 18 12 17 17 12C22 7 21 2 21 2C21 2 16 3 11 8C6 13 5 19 2 22Z" />
              </svg>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs font-semibold select-none">
        <Link href="/login" className="text-emerald-600 dark:text-emerald-450 font-bold hover:underline">
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
