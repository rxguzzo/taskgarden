'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateLifeAreaAction, archiveLifeAreaAction } from '../../app/(dashboard)/garden/actions';
import { createTaskAction } from '../../app/(dashboard)/tasks/actions';
import { LifeArea } from '../../domain/growth/types';

interface AreaHeaderActionsProps {
  area: LifeArea;
}

export function AreaHeaderActions({ area }: AreaHeaderActionsProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);

  const [editState, editFormAction, isEditPending] = useActionState(updateLifeAreaAction, null);
  const [taskState, taskFormAction, isTaskPending] = useActionState(createTaskAction, null);

  // Close modals on success
  useEffect(() => {
    if (editState?.success) {
      setIsEditOpen(false);
    }
  }, [editState]);

  useEffect(() => {
    if (taskState?.success) {
      setIsTaskOpen(false);
    }
  }, [taskState]);

  const handleArchive = async () => {
    if (confirm('Tem certeza que deseja arquivar esta área da vida? Isso ocultará a árvore correspondente do Jardim.')) {
      const res = await archiveLifeAreaAction(area.id);
      if (res.success) {
        router.push('/garden');
      } else {
        alert(res.error || 'Erro ao arquivar área.');
      }
    }
  };

  const colors = [
    { value: 'emerald', label: 'Verde Esmeralda' },
    { value: 'blue', label: 'Azul Celeste' },
    { value: 'purple', label: 'Roxo Místico' },
    { value: 'amber', label: 'Âmbar Dourado' },
    { value: 'rose', label: 'Rosa Brilhante' },
    { value: 'slate', label: 'Cinza Slate' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Botão Plantar Tarefa */}
      <button
        type="button"
        onClick={() => setIsTaskOpen(true)}
        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span>Plantar tarefa</span>
      </button>

      {/* Botão Editar Área */}
      <button
        type="button"
        onClick={() => setIsEditOpen(true)}
        className="px-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-center gap-1.5 cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
        </svg>
        <span>Editar Área</span>
      </button>

      {/* Botão Arquivar Área */}
      <button
        type="button"
        onClick={handleArchive}
        className="px-4 py-2.5 bg-zinc-100 hover:bg-red-500/10 dark:bg-zinc-900 dark:hover:bg-red-500/20 text-zinc-600 hover:text-red-600 dark:text-zinc-400 font-semibold rounded-xl text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
        <span>Arquivar</span>
      </button>

      {/* Modal: Editar Área */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl relative">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Editar Área da Vida</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Atualize as informações sobre este cultivo.</p>
            </div>

            <form action={editFormAction} className="space-y-4">
              {editState?.error && (
                <div className="bg-red-500/10 text-red-800 dark:text-red-300 p-3 rounded-xl text-xs border border-red-500/20">
                  ⚠️ {editState.error}
                </div>
              )}

              <input type="hidden" name="area_id" value={area.id} />

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="name">
                  Nome da Área *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  defaultValue={area.name}
                  disabled={isEditPending}
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
                  defaultValue={area.description || ''}
                  disabled={isEditPending}
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
                  disabled={isEditPending}
                  defaultValue={area.color}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {colors.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isEditPending}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isEditPending}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md transition-colors"
                >
                  {isEditPending ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Criar Tarefa */}
      {isTaskOpen && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl relative">
            <button
              onClick={() => setIsTaskOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Plantar Semente em {area.name}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Insira os detalhes para a nova tarefa desta área.</p>
            </div>

            <form action={taskFormAction} className="space-y-4">
              {taskState?.error && (
                <div className="bg-red-500/10 text-red-800 dark:text-red-300 p-3 rounded-xl text-xs border border-red-500/20">
                  ⚠️ {taskState.error}
                </div>
              )}

              <input type="hidden" name="life_area_id" value={area.id} />

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="task_title">
                  Título da Tarefa *
                </label>
                <input
                  id="task_title"
                  name="title"
                  type="text"
                  required
                  placeholder="Ex: Resolver pendências do projeto"
                  disabled={isTaskPending}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="task_description">
                  Descrição (Opcional)
                </label>
                <textarea
                  id="task_description"
                  name="description"
                  rows={2}
                  placeholder="Descrição opcional..."
                  disabled={isTaskPending}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="task_difficulty">
                    Dificuldade
                  </label>
                  <select
                    id="task_difficulty"
                    name="difficulty"
                    defaultValue="MEDIUM"
                    disabled={isTaskPending}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="EASY">Fácil</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HARD">Difícil</option>
                    <option value="VERY_HARD">Muito Difícil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="task_priority">
                    Prioridade
                  </label>
                  <select
                    id="task_priority"
                    name="priority"
                    defaultValue="MEDIUM"
                    disabled={isTaskPending}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="task_due_date">
                  Prazo de Conclusão (Colheita)
                </label>
                <input
                  id="task_due_date"
                  name="due_date"
                  type="date"
                  disabled={isTaskPending}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsTaskOpen(false)}
                  disabled={isTaskPending}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isTaskPending}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md transition-colors"
                >
                  {isTaskPending ? 'Plantando...' : 'Plantar Semente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
