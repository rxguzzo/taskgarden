'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Habit, HabitCompletion, LifeArea } from '../../domain/growth/types';
import { toggleHabitCompletionAction, archiveHabitAction } from '../../app/(dashboard)/calendar/actions';
import { getTodayDateOnly, getIsoWeekKey } from '../../utils/date';
import { HabitModal } from '../calendar/HabitModal';

interface AreaRoutinesListProps {
  habits: Habit[];
  completions: HabitCompletion[];
  lifeAreas: LifeArea[];
}

export function AreaRoutinesList({ habits, completions, lifeAreas }: AreaRoutinesListProps) {
  const [localHabits, setLocalHabits] = useState<Habit[]>(habits);
  const [localCompletions, setLocalCompletions] = useState<HabitCompletion[]>(completions);
  const [pendingHabitActionIds, setPendingHabitActionIds] = useState<Record<string, boolean>>({});
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  useEffect(() => {
    setLocalHabits(habits);
  }, [habits]);

  useEffect(() => {
    setLocalCompletions(completions);
  }, [completions]);

  const todayDateStr = getTodayDateOnly();

  const isHabitCompleted = (habit: Habit, currentCompletions: HabitCompletion[]) => {
    if (habit.frequency === 'WEEKLY') {
      const weekKey = getIsoWeekKey(todayDateStr);
      return currentCompletions.some(c => c.habit_id === habit.id && c.period_type === 'WEEK' && c.period_key === weekKey);
    }
    if (habit.frequency === 'MONTHLY') {
      const monthKey = todayDateStr.substring(0, 7);
      return currentCompletions.some(c => c.habit_id === habit.id && c.period_type === 'MONTH' && c.period_key === monthKey);
    }
    return currentCompletions.some(c => c.habit_id === habit.id && c.period_type === 'DAY' && c.period_key === todayDateStr);
  };

  const getHabitStatusLabel = (habit: Habit, completed: boolean) => {
    if (habit.frequency === 'WEEKLY') {
      return completed ? 'Feito nesta semana' : 'Pendente nesta semana';
    }
    if (habit.frequency === 'MONTHLY') {
      return completed ? 'Feito este mês' : 'Pendente este mês';
    }
    return completed ? 'Feito hoje' : 'Pendente hoje';
  };

  const getFrequencyLabel = (habit: Habit) => {
    switch (habit.frequency) {
      case 'DAILY':
        return 'Todos os dias';
      case 'WEEKDAYS':
        return 'Segunda a sexta';
      case 'CUSTOM_WEEKLY':
        const days = habit.custom_days || [];
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return `Dias: ${days.map(d => dayNames[d]).join(', ')}`;
      case 'WEEKLY':
        return 'Toda semana';
      case 'MONTHLY':
        return `Todo dia ${habit.day_of_month}`;
      default:
        return 'Rotina';
    }
  };

  const handleToggleHabit = async (habitId: string) => {
    if (pendingHabitActionIds[habitId]) return;
    setPendingHabitActionIds(prev => ({ ...prev, [habitId]: true }));

    const previousCompletions = [...localCompletions];
    const habit = localHabits.find(h => h.id === habitId);
    if (!habit) return;

    let periodType: 'DAY' | 'WEEK' | 'MONTH' = 'DAY';
    let periodKey = todayDateStr;

    if (habit.frequency === 'WEEKLY') {
      periodType = 'WEEK';
      periodKey = getIsoWeekKey(todayDateStr);
    } else if (habit.frequency === 'MONTHLY') {
      periodType = 'MONTH';
      periodKey = todayDateStr.substring(0, 7);
    }

    const isCompleted = localCompletions.some(
      c => c.habit_id === habitId && c.period_type === periodType && c.period_key === periodKey
    );

    // Otimista
    if (isCompleted) {
      setLocalCompletions(prev => prev.filter(
        c => !(c.habit_id === habitId && c.period_type === periodType && c.period_key === periodKey)
      ));
    } else {
      setLocalCompletions(prev => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          habit_id: habitId,
          user_id: '',
          completed_date: todayDateStr,
          period_type: periodType,
          period_key: periodKey,
          created_at: new Date().toISOString()
        }
      ]);
    }

    try {
      const res = await toggleHabitCompletionAction(habitId);
      if (!res.success) {
        setLocalCompletions(previousCompletions);
        alert(res.error || 'Erro ao atualizar rotina.');
      }
    } catch {
      setLocalCompletions(previousCompletions);
      alert('Erro de conexão ao atualizar rotina.');
    } finally {
      setPendingHabitActionIds(prev => ({ ...prev, [habitId]: false }));
    }
  };

  const handleArchiveHabit = async (habitId: string) => {
    if (pendingHabitActionIds[habitId]) return;
    if (!confirm('Tem certeza que deseja arquivar esta rotina? Ela deixará de aparecer no sistema.')) return;

    setPendingHabitActionIds(prev => ({ ...prev, [habitId]: true }));
    const previousHabits = [...localHabits];

    setLocalHabits(prev => prev.filter(h => h.id !== habitId));

    try {
      const res = await archiveHabitAction(habitId);
      if (!res.success) {
        setLocalHabits(previousHabits);
        alert(res.error || 'Erro ao arquivar rotina.');
      }
    } catch {
      setLocalHabits(previousHabits);
      alert('Erro de conexão ao arquivar rotina.');
    } finally {
      setPendingHabitActionIds(prev => ({ ...prev, [habitId]: false }));
    }
  };

  const activeHabits = localHabits.filter(h => h.is_active && h.deleted_at === null);

  return (
    <Card variant="solid" className="p-6 space-y-4">
      <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-3">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          🔄 Rotinas do Cultivo ({activeHabits.length})
        </h3>
      </div>

      {activeHabits.length === 0 ? (
        <div className="text-sm text-zinc-400 dark:text-zinc-550 py-8 text-center font-medium border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
          Nenhuma rotina cadastrada para esta área da vida.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeHabits.map(habit => {
            const completed = isHabitCompleted(habit, localCompletions);
            const isActionPending = !!pendingHabitActionIds[habit.id];
            const statusLabel = getHabitStatusLabel(habit, completed);

            return (
              <div
                key={habit.id}
                className={`bg-white/80 dark:bg-zinc-900/80 border rounded-2xl p-4 flex gap-4 items-center justify-between shadow-sm transition-all hover:border-emerald-500/20 group relative overflow-hidden ${
                  completed ? 'border-zinc-200/40 dark:border-zinc-850/40 opacity-75' : 'border-zinc-200/60 dark:border-zinc-800/80'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Checkbox de Conclusão Otimista */}
                  <button
                    onClick={() => handleToggleHabit(habit.id)}
                    disabled={isActionPending}
                    aria-label={`Concluir rotina: ${habit.title}`}
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center cursor-pointer transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                      completed
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-zinc-350 dark:border-zinc-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                    }`}
                  >
                    {isActionPending ? (
                      <svg className="animate-spin h-3.5 w-3.5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : completed ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 text-white animate-scale-up">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    ) : (
                      <span className="w-2.5 h-2.5 rounded bg-emerald-500 scale-0 group-hover:scale-100 transition-transform" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className={`text-sm font-bold truncate ${
                      completed ? 'line-through text-zinc-450 dark:text-zinc-550' : 'text-zinc-850 dark:text-zinc-200'
                    }`}>
                      {habit.title}
                    </h4>
                    {habit.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                        {habit.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-zinc-200/30 text-zinc-550 dark:text-zinc-400 bg-zinc-100/50 dark:bg-zinc-800/40">
                        {getFrequencyLabel(habit)}
                      </span>
                      <span className={`text-[9px] font-bold ${
                        completed ? 'text-emerald-600 dark:text-emerald-450' : 'text-zinc-450 dark:text-zinc-550'
                      }`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingHabit(habit)}
                    disabled={isActionPending}
                    title="Editar rotina"
                    aria-label={`Editar rotina: ${habit.title}`}
                    className="p-1.5 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-950/20 rounded-xl transition-all shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 17.062a4.5 4.5 0 0 1-1.897 1.13L3 19l.893-3.03a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleArchiveHabit(habit.id)}
                    disabled={isActionPending}
                    title="Arquivar rotina"
                    aria-label={`Arquivar rotina: ${habit.title}`}
                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-950/20 rounded-xl transition-all shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingHabit && (
        <HabitModal
          lifeAreas={lifeAreas}
          habitToEdit={editingHabit}
          onClose={() => setEditingHabit(null)}
        />
      )}
    </Card>
  );
}
