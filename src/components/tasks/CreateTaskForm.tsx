'use client';

import React, { useActionState, useEffect } from 'react';
import { createTaskAction } from '../../app/(dashboard)/tasks/actions';
import { LifeArea } from '../../domain/growth/types';
import { Card } from '../ui/Card';

interface CreateTaskFormProps {
  areas: LifeArea[];
}

export function CreateTaskForm({ areas }: CreateTaskFormProps) {
  const [state, formAction, isPending] = useActionState(createTaskAction, null);

  // Limpa os campos de texto se salvar com sucesso
  useEffect(() => {
    if (state?.success) {
      const form = document.getElementById('create-task-form') as HTMLFormElement;
      if (form) form.reset();
    }
  }, [state]);

  return (
    <Card variant="glass" className="space-y-6">
      <form id="create-task-form" action={formAction} className="space-y-6">
        {state?.error && (
          <div className="bg-red-500/10 text-red-800 dark:text-red-300 p-4 rounded-xl text-sm border border-red-500/20">
            ⚠️ {state.error}
          </div>
        )}

        {state?.message && (
          <div className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl text-sm border border-emerald-500/20">
            🌱 {state.message}
          </div>
        )}

        {/* Título da Tarefa */}
        <div>
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="title">
            Título da Semente (Tarefa) *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="Ex: Estudar Next.js App Router"
            required
            disabled={isPending}
            maxLength={255}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
          />
        </div>

        {/* Dificuldade e Prioridade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="difficulty">
              Dificuldade *
            </label>
            <select
              id="difficulty"
              name="difficulty"
              defaultValue="MEDIUM"
              disabled={isPending}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            >
              <option value="EASY">Fácil</option>
              <option value="MEDIUM">Média</option>
              <option value="HARD">Difícil</option>
              <option value="VERY_HARD">Muito Difícil</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="priority">
              Prioridade *
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue="MEDIUM"
              disabled={isPending}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            >
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>
          </div>
        </div>

        {/* Área da Vida (Categoria) e Prazo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="life_area_id">
              Área da Vida (Árvore) *
            </label>
            <select
              id="life_area_id"
              name="life_area_id"
              required
              disabled={isPending}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            >
              <option value="">Selecione uma área...</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name} ({area.color})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="due_date">
              Prazo de Conclusão (Colheita)
            </label>
            <input
              id="due_date"
              name="due_date"
              type="date"
              disabled={isPending}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="description">
            Descrição do Objetivo
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            disabled={isPending}
            maxLength={1000}
            placeholder="O que você precisa realizar para que esta semente cresça?"
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all resize-none"
          />
        </div>

        {/* Botão de Enviar */}
        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              const form = document.getElementById('create-task-form') as HTMLFormElement;
              if (form) form.reset();
            }}
            className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            Limpar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md transition-colors"
          >
            {isPending ? 'Plantando...' : 'Plantar Semente'}
          </button>
        </div>
      </form>
    </Card>
  );
}
