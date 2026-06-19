'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '../ui/Card';
import { formatFriendlyDate } from '../../utils/date';
import { Task, WorkSession, LifeArea } from '../../domain/growth/types';
import { calculateTaskProgress } from '../../domain/growth/rules';
import {
  completeTaskAction,
  deleteTaskAction,
  updateTaskAction,
  pruneTaskAction,
} from '../../app/(dashboard)/tasks/actions';
import {
  createWorkSessionAction,
  deleteWorkSessionAction,
} from '../../app/(dashboard)/work-sessions/actions';
import {
  createSubtaskAction,
  updateSubtaskAction,
  toggleSubtaskAction,
  deleteSubtaskAction,
} from '../../app/(dashboard)/subtasks/actions';

interface AreaTasksListProps {
  tasks: Task[];
  sessions: WorkSession[];
  area?: LifeArea;
}

export function AreaTasksList({ tasks, sessions, area }: AreaTasksListProps) {
  const activeTasks = tasks.filter((t) => t.status === 'ACTIVE');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const prunedTasks = tasks.filter((t) => t.status === 'PRUNED');

  // States for Modals
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [pruningTask, setPruningTask] = useState<Task | null>(null);
  const [loggingTimeTask, setLoggingTimeTask] = useState<Task | null>(null);

  // Estados locais para gerenciar subtarefas
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<{ [taskId: string]: string }>({});
  const [isSubtaskActionPending, setIsSubtaskActionPending] = useState<{ [key: string]: boolean }>({});

  // Handlers para subtarefas
  const handleCreateSubtask = async (taskId: string, e: React.FormEvent) => {
    e.preventDefault();
    const title = newSubtaskTitle[taskId];
    if (!title || !title.trim()) return;

    setIsSubtaskActionPending(prev => ({ ...prev, [taskId]: true }));
    try {
      const formData = new FormData();
      formData.append('task_id', taskId);
      formData.append('title', title.trim());

      const res = await createSubtaskAction(null, formData);
      if (res.success) {
        setNewSubtaskTitle(prev => ({ ...prev, [taskId]: '' }));
      } else {
        alert(res.error || 'Erro ao criar subtarefa.');
      }
    } finally {
      setIsSubtaskActionPending(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const handleUpdateSubtask = async (subtaskId: string) => {
    if (!editingSubtaskTitle || !editingSubtaskTitle.trim()) return;
    setIsSubtaskActionPending(prev => ({ ...prev, [subtaskId]: true }));
    try {
      const res = await updateSubtaskAction(subtaskId, editingSubtaskTitle.trim());
      if (res.success) {
        setEditingSubtaskId(null);
      } else {
        alert(res.error || 'Erro ao editar subtarefa.');
      }
    } finally {
      setIsSubtaskActionPending(prev => ({ ...prev, [subtaskId]: false }));
    }
  };

  const handleToggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    setIsSubtaskActionPending(prev => ({ ...prev, [subtaskId]: true }));
    try {
      const res = await toggleSubtaskAction(subtaskId, isCompleted);
      if (!res.success) {
        alert(res.error || 'Erro ao alternar status da subtarefa.');
      }
    } finally {
      setIsSubtaskActionPending(prev => ({ ...prev, [subtaskId]: false }));
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (confirm('Tem certeza que deseja excluir esta subtarefa?')) {
      setIsSubtaskActionPending(prev => ({ ...prev, [subtaskId]: true }));
      try {
        const res = await deleteSubtaskAction(subtaskId);
        if (!res.success) {
          alert(res.error || 'Erro ao excluir subtarefa.');
        }
      } finally {
        setIsSubtaskActionPending(prev => ({ ...prev, [subtaskId]: false }));
      }
    }
  };

  // useActionState for Modals
  const [editState, editFormAction, isEditPending] = useActionState(updateTaskAction, null);
  const [pruneState, pruneFormAction, isPrunePending] = useActionState(pruneTaskAction, null);
  const [logTimeState, logTimeFormAction, isLogTimePending] = useActionState(createWorkSessionAction, null);

  // Close modals on success
  useEffect(() => {
    if (editState?.success) {
      setEditingTask(null);
    }
  }, [editState]);

  useEffect(() => {
    if (pruneState?.success) {
      setPruningTask(null);
    }
  }, [pruneState]);

  useEffect(() => {
    if (logTimeState?.success) {
      setLoggingTimeTask(null);
    }
  }, [logTimeState]);

  // Handler Actions
  const handleComplete = async (taskId: string) => {
    const res = await completeTaskAction(taskId);
    if (!res.success) {
      alert(res.error || 'Erro ao concluir tarefa.');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (confirm('Tem certeza que deseja excluir esta semente? Esta ação é irreversível.')) {
      const res = await deleteTaskAction(taskId);
      if (!res.success) {
        alert(res.error || 'Erro ao excluir tarefa.');
      }
    }
  };

  const getDueDateString = (isoString: string | null) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Computa o tempo dedicado por tarefa
  const minutesByTask = new Map<string, number>();
  sessions.forEach((s) => {
    const prev = minutesByTask.get(s.task_id) || 0;
    minutesByTask.set(s.task_id, prev + s.duration_minutes);
  });

  const getTaskDurationString = (taskId: string) => {
    const totalMin = minutesByTask.get(taskId) || 0;
    if (totalMin === 0) return '';
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-8">
      {/* 1. Tarefas Ativas */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
          🌱 Tarefas Ativas ({activeTasks.length})
        </h2>

        {activeTasks.length === 0 ? (
          <Card variant="solid" className="text-center py-10 bg-white/40 dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <div className="w-12 h-12 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
              🌱
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Nenhuma semente ativa</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              Você não possui nenhuma semente (tarefa) em cultivo nesta área de vida no momento.
            </p>
            <div className="mt-4">
              <Link
                href={`/tasks?areaId=${area?.id || ''}`}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors inline-block"
                aria-label="Plantar Primeira Semente"
              >
                Plantar Primeira Semente
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeTasks.map((task) => {
              const progress = calculateTaskProgress(task, task.subtasks);
              const taskSubtasks = task.subtasks || [];
              const activeSubtasks = taskSubtasks.filter(s => s.deleted_at === null);
              const completedSubtasksCount = activeSubtasks.filter(s => s.is_completed).length;
              const hasSubtasks = activeSubtasks.length > 0;

              return (
                <Card key={task.id} variant="glass" className="p-3 sm:p-4 hover:border-emerald-500/10 transition-all space-y-4 min-w-0">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-zinc-800 dark:text-white break-words">{task.title}</h3>
                      {task.description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl break-words">{task.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                        {getTaskDurationString(task.id) && (
                          <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-bold flex items-center gap-0.5 border border-emerald-500/10 shrink-0">
                            ⏱️ {getTaskDurationString(task.id)} dedicado
                          </span>
                        )}
                        <span className="bg-zinc-100 dark:bg-zinc-950 px-2 py-0.5 rounded font-medium shrink-0">
                          Dificuldade: {task.difficulty}
                        </span>
                        <span className="bg-zinc-100 dark:bg-zinc-950 px-2 py-0.5 rounded font-medium shrink-0">
                          Prioridade: {task.priority}
                        </span>
                        {task.due_date && (
                          <span className="shrink-0">Prazo: {formatFriendlyDate(task.due_date)}</span>
                        )}
                      </div>
                    </div>

                    {/* Progresso e Controles */}
                    <div className="flex flex-wrap items-center justify-between xl:justify-end gap-4 min-w-0 w-full xl:w-auto">
                      {/* Progresso */}
                      <div className="flex items-center gap-3 text-right shrink-0">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{progress}%</span>
                        <div className="w-24 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-1 w-full sm:w-auto min-w-0">
                        <button
                          type="button"
                          onClick={() => setLoggingTimeTask(task)}
                          aria-label="Registrar tempo dedicado"
                          className="px-2 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 border border-zinc-200/40 dark:border-zinc-800/40 shrink-0"
                          title="Registrar tempo dedicado"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-zinc-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          <span>Tempo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleComplete(task.id)}
                          aria-label="Concluir e colher semente"
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
                          title="Concluir e Colher"
                        >
                          Concluir
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTask(task)}
                          aria-label="Editar tarefa"
                          className="px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer shrink-0"
                          title="Editar Tarefa"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setPruningTask(task)}
                          aria-label="Podar tarefa"
                          className="px-2 py-1.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-350 rounded-lg text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                          title="Podar Tarefa"
                        >
                          Podar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(task.id)}
                          aria-label="Excluir semente"
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Excluir semente"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Banner de Sugestão de Colheita (CTA) */}
                  {progress === 100 && (
                    <div className="bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse-slow">
                      <div className="flex items-center gap-2 text-xs text-emerald-805 dark:text-emerald-300 font-semibold">
                        <span>🎉</span>
                        <span>Todas as subtarefas e etapas foram concluídas! Deseja colher esta semente e enviá-la para a Estufa?</span>
                      </div>
                      <button
                        onClick={() => handleComplete(task.id)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer w-full sm:w-auto text-center"
                      >
                        Colher Semente
                      </button>
                    </div>
                  )}

                  {/* Interface de Subtarefas */}
                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/60 w-full min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Subtarefas {hasSubtasks ? `(${completedSubtasksCount}/${activeSubtasks.length})` : ''}
                      </span>
                    </div>

                    {/* Lista de subtarefas */}
                    {hasSubtasks && (
                      <ul className="space-y-2 mb-3 w-full min-w-0">
                        {activeSubtasks.map((sub) => {
                          const isEditing = editingSubtaskId === sub.id;
                          return (
                            <li
                              key={sub.id}
                              className={`flex items-center justify-between gap-3 text-xs bg-zinc-50/50 dark:bg-zinc-950/20 px-3 py-2 rounded-xl border border-zinc-200/40 dark:border-zinc-850/30 hover:bg-zinc-50 dark:hover:bg-zinc-950/40 transition-colors min-w-0 w-full ${isSubtaskActionPending[sub.id] ? 'opacity-55 pointer-events-none' : ''}`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={sub.is_completed}
                                  onChange={() => handleToggleSubtask(sub.id, !sub.is_completed)}
                                  disabled={!!isSubtaskActionPending[sub.id]}
                                  aria-label={`Marcar subtarefa "${sub.title}" como concluída`}
                                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 accent-emerald-500 cursor-pointer shrink-0"
                                />
                                {isEditing ? (
                                  <div className="flex items-center gap-1 flex-1 min-w-0">
                                    <input
                                      type="text"
                                      value={editingSubtaskTitle}
                                      onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                                      disabled={!!isSubtaskActionPending[sub.id]}
                                      aria-label="Editar título da subtarefa"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleUpdateSubtask(sub.id);
                                        } else if (e.key === 'Escape') {
                                          setEditingSubtaskId(null);
                                        }
                                      }}
                                      className="flex-1 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 min-w-0"
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSubtask(sub.id)}
                                      disabled={!!isSubtaskActionPending[sub.id]}
                                      aria-label="Salvar alteração da subtarefa"
                                      className="p-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 shrink-0"
                                      title="Salvar"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingSubtaskId(null)}
                                      disabled={!!isSubtaskActionPending[sub.id]}
                                      aria-label="Cancelar alteração da subtarefa"
                                      className="p-1 text-zinc-400 hover:text-zinc-650 shrink-0"
                                      title="Cancelar"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                  <span
                                    onDoubleClick={() => {
                                      if (!isSubtaskActionPending[sub.id]) {
                                        setEditingSubtaskId(sub.id);
                                        setEditingSubtaskTitle(sub.title);
                                      }
                                    }}
                                    className={`truncate cursor-pointer select-none block flex-1 min-w-0 ${
                                      sub.is_completed
                                        ? 'line-through text-zinc-400 dark:text-zinc-550'
                                        : 'text-zinc-700 dark:text-zinc-300 font-medium'
                                    }`}
                                    title="Clique duplo para editar"
                                  >
                                    {sub.title}
                                  </span>
                                )}
                              </div>

                              {!isEditing && (
                                <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSubtaskId(sub.id);
                                      setEditingSubtaskTitle(sub.title);
                                    }}
                                    disabled={!!isSubtaskActionPending[sub.id]}
                                    aria-label="Editar subtarefa"
                                    className="p-1 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 transition-colors shrink-0"
                                    title="Editar subtarefa"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSubtask(sub.id)}
                                    disabled={!!isSubtaskActionPending[sub.id]}
                                    aria-label="Excluir subtarefa"
                                    className="p-1 text-zinc-400 hover:text-red-500 transition-colors shrink-0"
                                    title="Excluir subtarefa"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {/* Form para adicionar nova subtarefa */}
                    <form onSubmit={(e) => handleCreateSubtask(task.id, e)} className="flex flex-col gap-2 sm:flex-row w-full min-w-0">
                      <input
                        type="text"
                        placeholder="Adicionar nova subtarefa..."
                        value={newSubtaskTitle[task.id] || ''}
                        onChange={(e) => setNewSubtaskTitle(prev => ({ ...prev, [task.id]: e.target.value }))}
                        disabled={!!isSubtaskActionPending[task.id]}
                        aria-label="Nova subtarefa"
                        className="flex-1 w-full min-w-0 px-3 py-1.5 rounded-xl border border-zinc-200/40 dark:border-zinc-800/40 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-55"
                      />
                      <button
                        type="submit"
                        disabled={!!isSubtaskActionPending[task.id] || !(newSubtaskTitle[task.id] || '').trim()}
                        className="w-full sm:w-auto shrink-0 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors text-center disabled:opacity-50"
                      >
                        {isSubtaskActionPending[task.id] ? 'Adicionando...' : 'Adicionar'}
                      </button>
                    </form>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Tarefas Concluídas */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
          ✓ Concluídas & Colhidas ({completedTasks.length})
        </h2>

        {completedTasks.length === 0 ? (
          <Card variant="solid" className="text-center py-6 text-sm text-zinc-500 dark:text-zinc-400">
            Nenhuma tarefa concluída no histórico recente.
          </Card>
        ) : (
          <div className="space-y-2">
            {completedTasks.map((task) => {
              const taskSubtasks = task.subtasks || [];
              const activeSubtasks = taskSubtasks.filter(s => s.deleted_at === null);

              return (
                <Card key={task.id} variant="solid" className="p-3 opacity-80 border-l-2 border-l-emerald-500 flex flex-col gap-2 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full min-w-0">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 line-through break-words block">
                        {task.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        {task.completed_at && (
                          <span className="text-[10px] text-zinc-450 dark:text-zinc-550 block shrink-0">
                            Concluída em: {formatFriendlyDate(task.completed_at)}
                          </span>
                        )}
                        {getTaskDurationString(task.id) && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 shrink-0">
                            • ⏱️ {getTaskDurationString(task.id)} dedicados
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full md:w-auto min-w-0">
                      <button
                        type="button"
                        onClick={() => setLoggingTimeTask(task)}
                        aria-label="Registrar tempo retroativo"
                        className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded border border-zinc-200/50 dark:border-zinc-800 text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                        title="Registrar tempo retroativo"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-zinc-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <span>Tempo</span>
                      </button>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 shrink-0">
                        Colhida
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(task.id)}
                        aria-label="Excluir histórico"
                        className="p-1 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                        title="Excluir histórico"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Subtarefas em modo leitura */}
                  {activeSubtasks.length > 0 && (
                    <div className="mt-1 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50 text-left">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">
                        Subtarefas:
                      </span>
                      <ul className="space-y-1">
                        {activeSubtasks.map((sub) => (
                          <li key={sub.id} className="flex items-center gap-2 text-xs text-zinc-500 min-w-0">
                            <span className={`text-[10px] select-none shrink-0 ${sub.is_completed ? 'text-emerald-500 font-bold' : 'text-zinc-350 dark:text-zinc-650'}`}>
                              {sub.is_completed ? '✓' : '○'}
                            </span>
                            <span className={`break-words flex-1 min-w-0 ${sub.is_completed ? 'line-through text-zinc-400 dark:text-zinc-550' : 'text-zinc-650 dark:text-zinc-350'}`}>
                              {sub.title}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Tarefas Podadas */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
          ✂ Podadas & Arquivadas ({prunedTasks.length})
        </h2>

        {prunedTasks.length === 0 ? (
          <Card variant="solid" className="text-center py-6 text-sm text-zinc-500 dark:text-zinc-400">
            Nenhuma tarefa podada nesta área.
          </Card>
        ) : (
          <div className="space-y-2">
            {prunedTasks.map((task) => {
              const taskSubtasks = task.subtasks || [];
              const activeSubtasks = taskSubtasks.filter(s => s.deleted_at === null);

              return (
                <Card key={task.id} variant="solid" className="p-3 opacity-70 border-l-2 border-l-red-500 bg-red-500/5 flex flex-col gap-2 min-w-0">
                  <div className="flex justify-between items-start gap-4 w-full min-w-0">
                    <div className="space-y-1 flex-1 min-w-0">
                      <span className="text-sm font-medium text-zinc-650 dark:text-zinc-350 break-words block">
                        {task.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {getTaskDurationString(task.id) && (
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 block shrink-0">
                            ⏱️ {getTaskDurationString(task.id)} dedicados
                          </span>
                        )}
                        {task.prune_reason && (
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 italic break-words">
                            Motivo: &quot;{task.prune_reason}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(task.id)}
                      aria-label="Excluir histórico"
                      className="p-1 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                      title="Excluir histórico"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>

                  {/* Subtarefas em modo leitura */}
                  {activeSubtasks.length > 0 && (
                    <div className="mt-1 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50 text-left">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">
                        Subtarefas:
                      </span>
                      <ul className="space-y-1">
                        {activeSubtasks.map((sub) => (
                          <li key={sub.id} className="flex items-center gap-2 text-xs text-zinc-500 min-w-0">
                            <span className={`text-[10px] select-none shrink-0 ${sub.is_completed ? 'text-zinc-400 dark:text-zinc-550' : 'text-zinc-300 dark:text-zinc-700'}`}>
                              {sub.is_completed ? '✓' : '○'}
                            </span>
                            <span className={`break-words flex-1 min-w-0 ${sub.is_completed ? 'line-through text-zinc-400 dark:text-zinc-550' : 'text-zinc-650 dark:text-zinc-350'}`}>
                              {sub.title}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Histórico de Dedicação da Área */}
      <div className="space-y-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <h2 className="text-base font-bold text-zinc-800 dark:text-white flex items-center gap-2">
          ⏱️ Histórico de Dedicação Recente ({sessions.length})
        </h2>

        {sessions.length === 0 ? (
          <Card variant="solid" className="text-center py-6 text-xs text-zinc-500 dark:text-zinc-400">
            Nenhuma sessão de trabalho registrada nesta área da vida.
          </Card>
        ) : (
          <div className="overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white/50 dark:bg-zinc-950/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold bg-zinc-50 dark:bg-zinc-950/50">
                    <th className="py-2.5 px-3">Tarefa</th>
                    <th className="py-2.5 px-3 w-20">Duração</th>
                    <th className="py-2.5 px-3 w-28">Data</th>
                    <th className="py-2.5 px-3">Anotação</th>
                    <th className="py-2.5 px-3 w-16 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => {
                    const taskTitle = tasks.find((t) => t.id === session.task_id)?.title || 'Tarefa Removida';
                    return (
                      <tr key={session.id} className="border-b last:border-0 border-zinc-150 dark:border-zinc-900 hover:bg-zinc-100/30 dark:hover:bg-zinc-900/30">
                        <td className="py-2.5 px-3 font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[160px]" title={taskTitle}>
                          {taskTitle}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-bold">
                          {session.duration_minutes} min
                        </td>
                        <td className="py-2.5 px-3 text-zinc-650 dark:text-zinc-350">
                          {formatFriendlyDate(session.worked_at)}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-450 italic truncate max-w-[200px]" title={session.note || ''}>
                          {session.note || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={async () => {
                              if (confirm('Deseja realmente excluir este registro de tempo? Isso reduzirá o tempo acumulado da árvore.')) {
                                const res = await deleteWorkSessionAction(session.id);
                                if (!res.success) {
                                  alert(res.error || 'Erro ao deletar sessão.');
                                }
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Remover Registro de Tempo"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Editar Tarefa */}
      {editingTask && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop-in">
          <div className="bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-scale-up">
            <button
              onClick={() => setEditingTask(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Editar Tarefa</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Atualize os parâmetros da semente.</p>
            </div>

            <form action={editFormAction} className="space-y-4">
              {editState?.error && (
                <div className="bg-red-500/10 text-red-800 dark:text-red-300 p-3 rounded-xl text-xs border border-red-500/20">
                  ⚠️ {editState.error}
                </div>
              )}

              <input type="hidden" name="task_id" value={editingTask.id} />

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="edit_title">
                  Título *
                </label>
                <input
                  id="edit_title"
                  name="title"
                  type="text"
                  required
                  defaultValue={editingTask.title}
                  disabled={isEditPending}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="edit_description">
                  Descrição (Opcional)
                </label>
                <textarea
                  id="edit_description"
                  name="description"
                  rows={2}
                  defaultValue={editingTask.description || ''}
                  disabled={isEditPending}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="edit_difficulty">
                    Dificuldade
                  </label>
                  <select
                    id="edit_difficulty"
                    name="difficulty"
                    defaultValue={editingTask.difficulty}
                    disabled={isEditPending}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="EASY">Fácil</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HARD">Difícil</option>
                    <option value="VERY_HARD">Muito Difícil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="edit_priority">
                    Prioridade
                  </label>
                  <select
                    id="edit_priority"
                    name="priority"
                    defaultValue={editingTask.priority}
                    disabled={isEditPending}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="edit_progress">
                    Progresso (%)
                  </label>
                  <input
                    id="edit_progress"
                    name="progress"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={editingTask.progress}
                    disabled={isEditPending}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="edit_due_date">
                    Prazo
                  </label>
                  <input
                    id="edit_due_date"
                    name="due_date"
                    type="date"
                    defaultValue={getDueDateString(editingTask.due_date)}
                    disabled={isEditPending}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
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

      {/* Modal: Podar Tarefa */}
      {pruningTask && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop-in">
          <div className="bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-scale-up">
            <button
              onClick={() => setPruningTask(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Podar Semente</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                A poda mantém a semente no histórico, mas interrompe seu cultivo atual. A justificativa é obrigatória.
              </p>
            </div>

            <form action={pruneFormAction} className="space-y-4">
              {pruneState?.error && (
                <div className="bg-red-500/10 text-red-800 dark:text-red-300 p-3 rounded-xl text-xs border border-red-500/20">
                  ⚠️ {pruneState.error}
                </div>
              )}

              <input type="hidden" name="task_id" value={pruningTask.id} />

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="prune_reason">
                  Motivo da Poda *
                </label>
                <textarea
                  id="prune_reason"
                  name="prune_reason"
                  rows={3}
                  required
                  placeholder="Por que você está podando esta tarefa? Ex: Mudança de prioridades, falta de tempo..."
                  disabled={isPrunePending}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setPruningTask(null)}
                  disabled={isPrunePending}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPrunePending}
                  className="px-5 py-2 bg-red-650 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md transition-colors"
                >
                  {isPrunePending ? 'Podando...' : 'Podar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Tempo Dedicado */}
      {loggingTimeTask && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop-in">
          <div className="bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-scale-up">
            <button
              onClick={() => setLoggingTimeTask(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Registrar Tempo Dedicado</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Grave o esforço despendido na semente: <strong className="text-emerald-600 dark:text-emerald-400">{loggingTimeTask.title}</strong>
              </p>
            </div>

            <form action={logTimeFormAction} className="space-y-4">
              {logTimeState?.error && (
                <div className="bg-red-500/10 text-red-800 dark:text-red-300 p-3 rounded-xl text-xs border border-red-500/20">
                  ⚠️ {logTimeState.error}
                </div>
              )}

              <input type="hidden" name="task_id" value={loggingTimeTask.id} />

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="duration_minutes">
                  Tempo Dedicado (Minutos) *
                </label>
                <input
                  id="duration_minutes"
                  name="duration_minutes"
                  type="number"
                  required
                  min={1}
                  max={720}
                  defaultValue={45}
                  disabled={isLogTimePending}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="worked_at">
                  Data do Cultivo *
                </label>
                <input
                  id="worked_at"
                  name="worked_at"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  disabled={isLogTimePending}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="note">
                  Anotações (Opcional)
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  maxLength={1000}
                  placeholder="O que você realizou nesta sessão?"
                  disabled={isLogTimePending}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setLoggingTimeTask(null)}
                  disabled={isLogTimePending}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLogTimePending}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md transition-colors"
                >
                  {isLogTimePending ? 'Registrando...' : 'Registrar Tempo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
