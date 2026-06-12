'use client';

import React from 'react';
import { Card } from '../../../components/ui/Card';

export default function PlantTaskPage() {
  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Plantar Nova Semente</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">Crie uma nova tarefa e cultive-a realizando suas atividades</p>
      </div>

      <Card variant="glass" className="space-y-6">
        <div className="bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl text-xs border border-emerald-500/20">
          🌱 **Nota do MVP**: Este formulário de criação de sementes é uma interface demonstrativa da fundação do projeto. A persistência funcional no Supabase Cloud será configurada nas próximas etapas.
        </div>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {/* Título da Tarefa */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="title">
              Título da Semente (Tarefa) *
            </label>
            <input
              id="title"
              type="text"
              placeholder="Ex: Estudar Next.js App Router"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            />
          </div>

          {/* Dificuldade e Prioridade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="difficulty">
                Dificuldade (Multiplicador de XP) *
              </label>
              <select
                id="difficulty"
                defaultValue="MEDIUM"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
              >
                <option value="EASY">Fácil (1.0x XP)</option>
                <option value="MEDIUM">Média (1.25x XP)</option>
                <option value="HARD">Difícil (1.5x XP)</option>
                <option value="VERY_HARD">Muito Difícil (2.0x XP)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="priority">
                Prioridade *
              </label>
              <select
                id="priority"
                defaultValue="MEDIUM"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
          </div>

          {/* Categoria e Prazo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="category">
                Categoria
              </label>
              <select
                id="category"
                defaultValue="work"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
              >
                <option value="work">Trabalho</option>
                <option value="studies">Estudos</option>
                <option value="health">Saúde</option>
                <option value="personal">Pessoal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="dueDate">
                Prazo de Conclusão (Colheita)
              </label>
              <input
                id="dueDate"
                type="date"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
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
              rows={3}
              placeholder="O que você precisa realizar para que esta semente cresça?"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            />
          </div>

          {/* Subtarefas */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Subtarefas (Broto de Etapas)
            </label>
            <div className="space-y-2 mb-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Fazer pesquisa inicial"
                  className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  className="px-4 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-medium rounded-xl text-sm hover:bg-emerald-100 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Botão de Enviar */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <button
              type="button"
              className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl text-sm hover:bg-zinc-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md transition-colors"
            >
              Plantar Semente
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
