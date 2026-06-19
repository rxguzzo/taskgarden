'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useActionState, useEffect } from 'react';
import { createLifeAreaAction } from '../../app/(dashboard)/garden/actions';

interface CreateAreaDialogProps {
  trigger?: React.ReactNode;
}

export function CreateAreaDialog({ trigger }: CreateAreaDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createLifeAreaAction, null);

  // Fecha o modal automaticamente quando for criado com sucesso
  useEffect(() => {
    if (state?.success) {
      setIsOpen(false);
    }
  }, [state]);

  const colors = [
    { value: 'emerald', label: 'Verde Esmeralda' },
    { value: 'blue', label: 'Azul Celeste' },
    { value: 'purple', label: 'Roxo Místico' },
    { value: 'amber', label: 'Âmbar Dourado' },
    { value: 'rose', label: 'Rosa Brilhante' },
    { value: 'slate', label: 'Cinza Slate' },
  ];

  return (
    <>
      {trigger ? (
        <span onClick={() => setIsOpen(true)} className="cursor-pointer" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsOpen(true); }} aria-label="Plantar Nova Área">
          {trigger}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          aria-label="Criar Nova Área"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Nova área</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop-in">
          <div className="bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-scale-up">
            <button
              onClick={() => setIsOpen(false)}
              disabled={isPending}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Plantar Nova Área</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Crie uma nova árvore no seu Jardim para gerenciar suas tarefas.</p>
            </div>

            <form action={formAction} className="space-y-4">
              {state?.error && !isPending && (
                <div className="bg-red-500/10 text-red-800 dark:text-red-300 p-3 rounded-xl text-xs border border-red-500/20">
                  ⚠️ {state.error}
                </div>
              )}

              {isPending ? (
                /* Animação de Jardinagem */
                <div className="flex flex-col items-center justify-center gap-4 py-8 animate-fade-in">
                  <div className="relative h-24 w-24">
                    {/* Semente descendo */}
                    <div className="absolute left-1/2 top-2 h-3 w-3 -translate-x-1/2 rounded-full bg-amber-700 animate-seed-drop" />
                    {/* Solo */}
                    <div className="absolute bottom-4 left-1/2 h-2 w-16 -translate-x-1/2 rounded-full bg-emerald-900/20 dark:bg-emerald-400/20" />
                    {/* Broto subindo */}
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-4xl animate-sprout-grow">
                      🌱
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 text-center animate-pulse">
                    Plantando sua nova área...
                  </p>
                </div>
              ) : (
                /* Campos do Formulário */
                <>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="name">
                      Nome da Área *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="Ex: Trabalho, Estudos, Pessoal"
                      disabled={isPending}
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="description">
                      Descrição (Opcional)
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={2}
                      placeholder="Do que se trata esta área da sua vida?"
                      disabled={isPending}
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="color">
                      Cor da Árvore
                    </label>
                    <select
                      id="color"
                      name="color"
                      disabled={isPending}
                      defaultValue="emerald"
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {colors.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
                >
                  {isPending ? 'Plantando...' : 'Plantar Área'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
