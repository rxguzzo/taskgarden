'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Task, LifeArea, Habit, HabitCompletion } from '../../domain/growth/types';
import { Card } from '../ui/Card';
import { completeTaskAction } from '../../app/(dashboard)/tasks/actions';
import { toggleHabitCompletionAction, archiveHabitAction } from '../../app/(dashboard)/calendar/actions';
import { getTodayDateOnly, toDateOnly, formatDateOnlyBr, getIsoWeekKey } from '../../utils/date';
import { CreateHabitModal } from './CreateHabitModal';

interface AgendaClientProps {
  initialTasks: Task[];
  lifeAreas: LifeArea[];
  initialHabits: Habit[];
  initialCompletions: HabitCompletion[];
}

const AREA_COLOR_MAP = {
  emerald: {
    bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-450 border-emerald-500/20 dark:border-emerald-500/30 hover:bg-emerald-500/20',
    dot: 'bg-emerald-500'
  },
  blue: {
    bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-450 border-blue-500/20 dark:border-blue-500/30 hover:bg-blue-500/20',
    dot: 'bg-blue-500'
  },
  purple: {
    bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-450 border-purple-500/20 dark:border-purple-500/30 hover:bg-purple-500/20',
    dot: 'bg-purple-500'
  },
  amber: {
    bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-450 border-amber-500/20 dark:border-amber-500/30 hover:bg-amber-500/20',
    dot: 'bg-amber-500'
  },
  rose: {
    bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-450 border-rose-500/20 dark:border-rose-500/30 hover:bg-rose-500/20',
    dot: 'bg-rose-500'
  },
  slate: {
    bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-450 border-slate-500/20 dark:border-slate-500/30 hover:bg-slate-500/20',
    dot: 'bg-slate-500'
  }
};

const PRIORITY_MAP = {
  LOW: { label: 'Baixa', color: 'text-zinc-550 bg-zinc-100 dark:bg-zinc-800' },
  MEDIUM: { label: 'Média', color: 'text-yellow-600 bg-yellow-500/10 dark:text-yellow-405 dark:bg-yellow-950/20' },
  HIGH: { label: 'Alta', color: 'text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-950/20' },
  URGENT: { label: 'Urgente', color: 'text-red-600 bg-red-500/10 dark:text-red-400 dark:bg-red-950/20' }
};

const DIFFICULTY_MAP = {
  EASY: 'Fácil',
  MEDIUM: 'Média',
  HARD: 'Difícil',
  VERY_HARD: 'Muito Difícil'
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getDaysDiff(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + 'T12:00:00');
  const d2 = new Date(dateStr2 + 'T12:00:00');
  const diffTime = d1.getTime() - d2.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getNextOccurrenceDate(habit: Habit, todayStr: string, completions: HabitCompletion[]): string {
  const today = new Date(todayStr + 'T12:00:00');
  for (let i = 0; i < 366; i++) {
    const current = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const currentStr = `${year}-${month}-${day}`;

    const dayOfWeek = current.getDay();
    const dayOfMonth = current.getDate();

    let matches = false;
    switch (habit.frequency) {
      case 'DAILY':
        matches = true;
        break;
      case 'WEEKDAYS':
        matches = dayOfWeek >= 1 && dayOfWeek <= 5;
        break;
      case 'CUSTOM_WEEKLY':
        matches = (habit.custom_days || []).includes(dayOfWeek);
        break;
      case 'WEEKLY':
        matches = true;
        break;
      case 'MONTHLY':
        matches = habit.day_of_month === dayOfMonth;
        break;
    }

    if (matches) {
      let isDone = false;
      if (habit.frequency === 'WEEKLY') {
        const weekKey = getIsoWeekKey(currentStr);
        isDone = completions.some(c => c.habit_id === habit.id && c.period_type === 'WEEK' && c.period_key === weekKey);
      } else if (habit.frequency === 'MONTHLY') {
        const monthKey = currentStr.substring(0, 7);
        isDone = completions.some(c => c.habit_id === habit.id && c.period_type === 'MONTH' && c.period_key === monthKey);
      } else {
        isDone = completions.some(c => c.habit_id === habit.id && c.period_type === 'DAY' && c.period_key === currentStr);
      }

      if (!isDone) {
        return currentStr;
      }
    }
  }
  return '';
}

function formatNextOccurrence(dateStr: string, todayStr: string): string {
  if (!dateStr) return 'Sem ocorrência';
  if (dateStr === todayStr) return 'Hoje';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}


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

const isHabitCompleted = (habit: Habit, completions: HabitCompletion[], todayStr: string) => {
  if (habit.frequency === 'WEEKLY') {
    const weekKey = getIsoWeekKey(todayStr);
    return completions.some(c => c.habit_id === habit.id && c.period_type === 'WEEK' && c.period_key === weekKey);
  }
  if (habit.frequency === 'MONTHLY') {
    const monthKey = todayStr.substring(0, 7);
    return completions.some(c => c.habit_id === habit.id && c.period_type === 'MONTH' && c.period_key === monthKey);
  }
  return completions.some(c => c.habit_id === habit.id && c.period_type === 'DAY' && c.period_key === todayStr);
};

const getHabitStatusLabel = (habit: Habit, completed: boolean) => {
  if (habit.frequency === 'WEEKLY') {
    return completed ? '✓ Feito nesta semana' : '○ Pendente nesta semana';
  }
  if (habit.frequency === 'MONTHLY') {
    return completed ? '✓ Feito este mês' : '○ Pendente este mês';
  }
  return completed ? '✓ Feito hoje' : '○ Pendente hoje';
};

export function AgendaClient({ initialTasks, lifeAreas, initialHabits, initialCompletions }: AgendaClientProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks);
  const [localHabits, setLocalHabits] = useState<Habit[]>(initialHabits);
  const [localCompletions, setLocalCompletions] = useState<HabitCompletion[]>(initialCompletions);

  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [pendingHabitActionIds, setPendingHabitActionIds] = useState<Record<string, boolean>>({});
  const [isCreateHabitOpen, setIsCreateHabitOpen] = useState(false);

  // Estados do mini-calendário
  const todayDateStr = getTodayDateOnly();
  const [currentDate, setCurrentDate] = useState(new Date());
  const calMonth = currentDate.getMonth();
  const calYear = currentDate.getFullYear();

  // Sincroniza props do servidor com estados locais ao revalidar
  useEffect(() => {
    setLocalTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    setLocalHabits(initialHabits);
  }, [initialHabits]);

  useEffect(() => {
    setLocalCompletions(initialCompletions);
  }, [initialCompletions]);

  // Mapeia áreas por ID
  const areasMap = useMemo(() => {
    return new Map(lifeAreas.map(a => [a.id, a]));
  }, [lifeAreas]);

  // Handler para concluir tarefa com UI otimista
  const handleCompleteTask = async (taskId: string) => {
    if (completingTaskId) return;
    setCompletingTaskId(taskId);

    const previousTasks = [...localTasks];

    // Atualização otimista local
    setLocalTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: 'COMPLETED' as const } : t))
    );

    try {
      const res = await completeTaskAction(taskId);
      if (!res.success) {
        setLocalTasks(previousTasks);
        alert(res.error || 'Erro ao concluir semente.');
      }
    } catch {
      setLocalTasks(previousTasks);
      alert('Erro de conexão ao concluir semente.');
    } finally {
      setCompletingTaskId(null);
    }
  };

  // Handler para marcar/desmarcar conclusão de rotina com UI otimista
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

    // Atualização otimista local
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

  // Handler para arquivar rotina com UI otimista
  const handleArchiveHabit = async (habitId: string) => {
    if (pendingHabitActionIds[habitId]) return;
    if (!confirm('Tem certeza que deseja arquivar esta rotina? Ela deixará de aparecer na sua agenda.')) return;

    setPendingHabitActionIds(prev => ({ ...prev, [habitId]: true }));
    const previousHabits = [...localHabits];

    // Atualização otimista local
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

  // Filtra as rotinas devidas para o dia de hoje
  const todaysHabits = useMemo(() => {
    const todayStr = getTodayDateOnly();
    const todayObj = new Date(todayStr + 'T12:00:00');
    const dayOfWeek = todayObj.getDay(); // 0 (Domingo) a 6 (Sábado)
    const dayOfMonth = todayObj.getDate(); // 1 a 31

    const activeHabits = localHabits.filter(h => h.is_active && h.deleted_at === null);

    return activeHabits.filter(habit => {
      switch (habit.frequency) {
        case 'DAILY':
          return true;
        case 'WEEKDAYS':
          return dayOfWeek >= 1 && dayOfWeek <= 5;
        case 'CUSTOM_WEEKLY':
          return (habit.custom_days || []).includes(dayOfWeek);
        case 'MONTHLY':
          return habit.day_of_month === dayOfMonth;
        default:
          return false;
      }
    });
  }, [localHabits]);

  // Classifica tarefas ativas
  const categorizedTasks = useMemo(() => {
    const active = localTasks.filter(t => t.status === 'ACTIVE');
    const todayStr = getTodayDateOnly();

    const overdue: Task[] = [];
    const todayTasks: Task[] = [];
    const upcoming: Task[] = [];
    const noDeadline: Task[] = [];

    active.forEach(task => {
      const taskDate = toDateOnly(task.due_date);
      if (!taskDate) {
        noDeadline.push(task);
      } else if (taskDate < todayStr) {
        overdue.push(task);
      } else if (taskDate === todayStr) {
        todayTasks.push(task);
      } else {
        upcoming.push(task);
      }
    });

    // Ordenação interna: mais urgentes primeiro
    const sortByUrgency = (a: Task, b: Task) => {
      const dateA = toDateOnly(a.due_date) || '';
      const dateB = toDateOnly(b.due_date) || '';
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      // Se empatar na data, ordena por prioridade
      const weightA = PRIORITY_MAP[a.priority]?.color ? 3 : 1;
      const weightB = PRIORITY_MAP[b.priority]?.color ? 3 : 1;
      return weightB - weightA;
    };

    overdue.sort(sortByUrgency);
    todayTasks.sort(sortByUrgency);
    upcoming.sort(sortByUrgency);
    noDeadline.sort((a, b) => {
      const pA = a.priority === 'URGENT' ? 4 : a.priority === 'HIGH' ? 3 : a.priority === 'MEDIUM' ? 2 : 1;
      const pB = b.priority === 'URGENT' ? 4 : b.priority === 'HIGH' ? 3 : b.priority === 'MEDIUM' ? 2 : 1;
      return pB - pA;
    });

    return { overdue, todayTasks, upcoming, noDeadline };
  }, [localTasks]);

  // Retorna a cor e o texto de urgência do prazo
  const getUrgencyInfo = (dueDate: string | null) => {
    const taskDate = toDateOnly(dueDate);
    if (!taskDate) {
      return {
        label: 'Sem prazo',
        badgeClass: 'text-zinc-550 dark:text-zinc-400 bg-zinc-500/5 dark:bg-zinc-800/20 border-zinc-200 dark:border-zinc-800/40'
      };
    }

    const todayStr = getTodayDateOnly();
    const diff = getDaysDiff(taskDate, todayStr);

    if (diff < 0) {
      return {
        label: `Atrasada (${Math.abs(diff)}d)`,
        badgeClass: 'text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-500/15 border-red-500/20'
      };
    }
    if (diff === 0) {
      return {
        label: 'Hoje',
        badgeClass: 'text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-500/15 border-red-500/20 font-bold'
      };
    }
    if (diff <= 2) {
      return {
        label: `Em ${diff} dias`,
        badgeClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20'
      };
    }
    if (diff <= 7) {
      return {
        label: `Em ${diff} dias`,
        badgeClass: 'text-yellow-600 dark:text-yellow-450 bg-yellow-500/10 dark:bg-yellow-555/15 border-yellow-500/20'
      };
    }
    return {
      label: formatDateOnlyBr(taskDate),
      badgeClass: 'text-emerald-600 dark:text-emerald-450 bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20'
    };
  };

  // Geração das células de dias do calendário
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
    const totalDays = new Date(calYear, calMonth + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }
    for (let day = 1; day <= totalDays; day++) {
      cells.push(day);
    }
    return cells;
  }, [calMonth, calYear]);

  // Verifica se um dia do mês selecionado tem tarefas ativas
  const getTasksForCalendarDay = (day: number) => {
    const formattedDay = String(day).padStart(2, '0');
    const formattedMonth = String(calMonth + 1).padStart(2, '0');
    const checkDateStr = `${calYear}-${formattedMonth}-${formattedDay}`;

    return localTasks.filter(t => t.status === 'ACTIVE' && toDateOnly(t.due_date) === checkDateStr);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(calYear, calMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(calYear, calMonth + 1, 1));
  };

  const formattedCalendarTitle = `${MONTH_NAMES[calMonth]} de ${calYear}`;

  const formattedTodayHeader = () => {
    const now = new Date();
    const day = now.getDate();
    const month = MONTH_NAMES[now.getMonth()];
    const year = now.getFullYear();
    return `Hoje, ${day} de ${month} de ${year}`;
  };

  const totalActiveCount = localTasks.filter(t => t.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* 1. Bloco de Resumo Superior */}
      <Card variant="glass" className="overflow-hidden relative animate-scale-up">
        <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10 pointer-events-none select-none">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-32 h-32 text-emerald-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-xs uppercase font-bold text-emerald-600 dark:text-emerald-450 tracking-wider">
                Hoje no seu jardim
              </span>
              <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white mt-0.5">
                {formattedTodayHeader()}
              </h2>
            </div>
            <button
              onClick={() => setIsCreateHabitOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Nova Rotina</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-100/40 dark:bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-900/60">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-550 uppercase font-bold">Atrasadas</span>
              <p className="text-2xl font-black text-red-650 dark:text-red-400 mt-1">
                {categorizedTasks.overdue.length}
              </p>
            </div>
            <div className="bg-zinc-100/40 dark:bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-900/60">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-550 uppercase font-bold">Para Hoje</span>
              <p className="text-2xl font-black text-amber-650 dark:text-amber-450 mt-1">
                {categorizedTasks.todayTasks.length}
              </p>
            </div>
            <div className="bg-zinc-100/40 dark:bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-900/60">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-550 uppercase font-bold">Rotinas de Hoje</span>
              <p className="text-2xl font-black text-emerald-650 dark:text-emerald-450 mt-1">
                {todaysHabits.length}
              </p>
            </div>
            <div className="bg-zinc-100/40 dark:bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-900/60">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-550 uppercase font-bold">Total Ativo</span>
              <p className="text-2xl font-black text-zinc-800 dark:text-zinc-200 mt-1">
                {totalActiveCount}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Área Principal com Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Colunas de Conteúdo (3/4 do espaço no desktop) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Seção: Rotinas de Hoje */}
          <div className="space-y-3">
            <h3 className="text-sm uppercase font-bold text-emerald-600 dark:text-emerald-450 tracking-wider flex items-center gap-1.5">
              🔄 Rotinas de Hoje ({todaysHabits.length})
            </h3>
            <div className="space-y-3">
              {todaysHabits.length === 0 ? (
                <div className="text-xs text-zinc-400 dark:text-zinc-550 py-5 px-4 bg-zinc-50/50 dark:bg-zinc-950/10 border border-dashed border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl text-center font-medium">
                  Nenhuma rotina programada para hoje. Clique em &quot;+ Nova Rotina&quot; para cadastrar!
                </div>
              ) : (
                todaysHabits.map(habit => {
                  const isDone = isHabitCompleted(habit, localCompletions, todayDateStr);
                  const area = areasMap.get(habit.life_area_id);
                  const areaColorInfo = area ? AREA_COLOR_MAP[area.color] : AREA_COLOR_MAP.slate;
                  const isActionPending = !!pendingHabitActionIds[habit.id];

                  return (
                    <div
                      key={habit.id}
                      className={`bg-white/80 dark:bg-zinc-900/80 border rounded-2xl p-4 flex gap-4 items-center justify-between shadow-sm transition-all hover:border-emerald-500/20 group relative overflow-hidden ${
                        isDone ? 'border-zinc-200/40 dark:border-zinc-850/40 opacity-70' : 'border-zinc-200/60 dark:border-zinc-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Checkbox de Conclusão Otimista */}
                        <button
                          onClick={() => handleToggleHabit(habit.id)}
                          disabled={isActionPending}
                          aria-label={`Concluir rotina: ${habit.title}`}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center cursor-pointer transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isDone
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                          }`}
                        >
                          {isActionPending ? (
                            <svg className="animate-spin h-3.5 w-3.5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : isDone ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 text-white animate-scale-up">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          ) : (
                            <span className="w-2.5 h-2.5 rounded bg-emerald-500 scale-0 group-hover:scale-100 transition-transform" />
                          )}
                        </button>

                        {/* Dados da Rotina */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className={`text-sm font-bold truncate flex-1 min-w-[120px] ${
                              isDone ? 'line-through text-zinc-400 dark:text-zinc-550' : 'text-zinc-800 dark:text-zinc-200'
                            }`}>
                              {habit.title}
                            </h4>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-zinc-200/30 text-zinc-550 dark:text-zinc-400 bg-zinc-100/50 dark:bg-zinc-800/40">
                              {getFrequencyLabel(habit)}
                            </span>
                          </div>

                          {habit.description && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                              {habit.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {area && (
                              <Link
                                href={`/garden/${area.id}`}
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all ${areaColorInfo.bg}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${areaColorInfo.dot}`} />
                                {area.name}
                              </Link>
                            )}
                            <span className={`text-[9px] font-bold ${
                              isDone ? 'text-emerald-600 dark:text-emerald-450 font-bold' : 'text-zinc-400 dark:text-zinc-550'
                            }`}>
                              {getHabitStatusLabel(habit, isDone)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botão Arquivar Rotina */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleArchiveHabit(habit.id)}
                          disabled={isActionPending}
                          title="Arquivar rotina"
                          aria-label={`Arquivar rotina: ${habit.title}`}
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-950/20 rounded-xl transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Seção: Atrasadas */}
          <div className="space-y-3">
            <h3 className="text-sm uppercase font-bold text-red-600 dark:text-red-400 tracking-wider flex items-center gap-1.5">
              ⚠️ Atrasadas ({categorizedTasks.overdue.length})
            </h3>
            <div className="space-y-3">
              {categorizedTasks.overdue.length === 0 ? (
                <div className="text-xs text-zinc-400 dark:text-zinc-550 py-4 px-4 bg-zinc-50/50 dark:bg-zinc-950/10 border border-dashed border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl text-center font-medium">
                  Nenhuma semente atrasada.
                </div>
              ) : (
                categorizedTasks.overdue.map(task => renderTaskItem(task))
              )}
            </div>
          </div>

          {/* Seção: Hoje */}
          <div className="space-y-3">
            <h3 className="text-sm uppercase font-bold text-amber-600 dark:text-amber-450 tracking-wider flex items-center gap-1.5">
              🌱 Para Hoje ({categorizedTasks.todayTasks.length})
            </h3>
            <div className="space-y-3">
              {categorizedTasks.todayTasks.length === 0 ? (
                <div className="text-xs text-zinc-400 dark:text-zinc-550 py-4 px-4 bg-zinc-50/50 dark:bg-zinc-950/10 border border-dashed border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl text-center font-medium">
                  Nenhuma semente para hoje.
                </div>
              ) : (
                categorizedTasks.todayTasks.map(task => renderTaskItem(task))
              )}
            </div>
          </div>

          {/* Seção: Próximas */}
          <div className="space-y-3">
            <h3 className="text-sm uppercase font-bold text-emerald-600 dark:text-emerald-450 tracking-wider flex items-center gap-1.5">
              📅 Próximas ({categorizedTasks.upcoming.length})
            </h3>
            <div className="space-y-3">
              {categorizedTasks.upcoming.length === 0 ? (
                <div className="text-xs text-zinc-400 dark:text-zinc-550 py-4 px-4 bg-zinc-50/50 dark:bg-zinc-950/10 border border-dashed border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl text-center font-medium">
                  Nenhuma semente futura agendada.
                </div>
              ) : (
                categorizedTasks.upcoming.map(task => renderTaskItem(task))
              )}
            </div>
          </div>

          {/* Seção: Sem Prazo */}
          <div className="space-y-3">
            <h3 className="text-sm uppercase font-bold text-zinc-500 dark:text-zinc-400 tracking-wider flex items-center gap-1.5">
              📦 Para Fazer / Sem Prazo ({categorizedTasks.noDeadline.length})
            </h3>
            <div className="space-y-3">
              {categorizedTasks.noDeadline.length === 0 ? (
                <div className="text-xs text-zinc-400 dark:text-zinc-550 py-4 px-4 bg-zinc-50/50 dark:bg-zinc-950/10 border border-dashed border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl text-center font-medium">
                  Nenhuma semente sem prazo no momento.
                </div>
              ) : (
                categorizedTasks.noDeadline.map(task => renderTaskItem(task))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar com Calendário e Hábitos (1/4 do espaço no desktop) */}
        <div className="space-y-6">
          {/* Mini-Calendário */}
          <Card variant="solid" className="p-4 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200/60 dark:border-zinc-800/80">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-650 dark:text-zinc-300 transition-colors"
                title="Mês anterior"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-200 tracking-tight">
                {formattedCalendarTitle}
              </h4>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-650 dark:text-zinc-300 transition-colors"
                title="Próximo mês"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAY_NAMES.map(w => (
                <span key={w} className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase">
                  {w}
                </span>
              ))}
            </div>

            {/* Grid de dias do mês */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} />;
                }

                const isToday = todayDateStr === `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayTasks = getTasksForCalendarDay(day);
                const hasTasks = dayTasks.length > 0;

                return (
                  <div
                    key={`day-${day}`}
                    className={`relative p-1.5 text-xs font-semibold rounded-lg flex flex-col items-center justify-center min-h-[2rem] select-none ${
                      isToday
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-zinc-755 dark:text-zinc-300 hover:bg-zinc-150 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>{day}</span>
                    {hasTasks && (
                      <span
                        className={`absolute bottom-1 w-1 h-1 rounded-full ${
                          isToday ? 'bg-white' : 'bg-emerald-500'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Card: Minhas Rotinas */}
          <Card variant="solid" className="p-4 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200/60 dark:border-zinc-800/80">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-200 tracking-tight flex items-center gap-1.5">
                🔄 Minhas Rotinas ({localHabits.filter(h => h.is_active && h.deleted_at === null).length})
              </h4>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {localHabits.filter(h => h.is_active && h.deleted_at === null).length === 0 ? (
                <div className="text-[10px] text-zinc-400 dark:text-zinc-550 text-center py-4 font-medium">
                  Nenhuma rotina cadastrada.
                </div>
              ) : (
                localHabits.filter(h => h.is_active && h.deleted_at === null).map(habit => {
                  const area = areasMap.get(habit.life_area_id);
                  const areaColorInfo = area ? AREA_COLOR_MAP[area.color] : AREA_COLOR_MAP.slate;
                  const isActionPending = !!pendingHabitActionIds[habit.id];

                  const nextDateStr = getNextOccurrenceDate(habit, todayDateStr, localCompletions);
                  const formattedNext = formatNextOccurrence(nextDateStr, todayDateStr);

                  return (
                    <div
                      key={habit.id}
                      className="bg-white/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/60 rounded-xl p-2.5 space-y-1.5 transition-all hover:border-emerald-500/10 text-left"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <h5 className="text-[11px] font-bold text-zinc-850 dark:text-zinc-200 truncate">
                            {habit.title}
                          </h5>
                          <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-semibold block">
                            Frequência: {getFrequencyLabel(habit)}
                          </span>
                          <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-semibold block">
                            Próxima: <span className="text-emerald-600 dark:text-emerald-450 font-bold">{formattedNext}</span>
                          </span>
                        </div>

                        <button
                          onClick={() => handleArchiveHabit(habit.id)}
                          disabled={isActionPending}
                          title="Arquivar rotina"
                          aria-label={`Arquivar rotina: ${habit.title}`}
                          className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-950/20 rounded-lg transition-all shrink-0"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                          </svg>
                        </button>
                      </div>

                      {area && (
                        <Link
                          href={`/garden/${area.id}`}
                          className={`inline-flex text-[8px] font-bold px-1.5 py-0.5 rounded-full border items-center gap-1 transition-all ${areaColorInfo.bg}`}
                        >
                          <span className={`w-1 h-1 rounded-full ${areaColorInfo.dot}`} />
                          {area.name}
                        </Link>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Dica de Cultivo das Rotinas */}
          <Card variant="glass" className="p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-emerald-650 dark:text-emerald-450 border-b border-emerald-950/5 dark:border-white/5 pb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1A3.75 3.75 0 0 0 12 18Z" />
              </svg>
              <h4 className="text-xs font-bold uppercase tracking-wider">Cultivo de Rotinas</h4>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Marcar uma rotina como concluída hoje registra sua execução no banco de dados e a mantém ativa para reaparecer no próximo ciclo programado. Streaks e histórico gráfico estão a caminho!
            </p>
          </Card>
        </div>
      </div>

      {/* Modal de Criação de Rotina */}
      {isCreateHabitOpen && (
        <CreateHabitModal
          lifeAreas={lifeAreas}
          onClose={() => setIsCreateHabitOpen(false)}
        />
      )}
    </div>
  );

  // Renderização individual de cada tarefa
  function renderTaskItem(task: Task) {
    const area = areasMap.get(task.life_area_id);
    const urgency = getUrgencyInfo(task.due_date);
    const priority = PRIORITY_MAP[task.priority] || { label: 'Normal', color: 'text-zinc-650 bg-zinc-100' };
    const areaColorInfo = area ? AREA_COLOR_MAP[area.color] : AREA_COLOR_MAP.slate;

    return (
      <div
        key={task.id}
        className="bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl p-4 flex gap-4 items-center justify-between shadow-sm transition-all hover:border-emerald-500/20 group relative overflow-hidden"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => handleCompleteTask(task.id)}
            disabled={completingTaskId === task.id}
            aria-label={`Concluir semente: ${task.title}`}
            className="w-5 h-5 rounded-lg border border-zinc-300 dark:border-zinc-700 flex items-center justify-center cursor-pointer transition-colors hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {completingTaskId === task.id ? (
              <svg className="animate-spin h-3.5 w-3.5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 scale-0 group-hover:scale-100 transition-transform" />
            )}
          </button>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate flex-1 min-w-[120px]">
                {task.title}
              </h4>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${urgency.badgeClass}`}>
                {urgency.label}
              </span>
            </div>

            {task.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {area && (
                <Link
                  href={`/garden/${area.id}`}
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all ${areaColorInfo.bg}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${areaColorInfo.dot}`} />
                  {area.name}
                </Link>
              )}

              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${priority.color}`}>
                {priority.label}
              </span>

              <span className="text-[9px] font-bold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full">
                {DIFFICULTY_MAP[task.difficulty]}
              </span>
            </div>
          </div>
        </div>

        {area && (
          <Link
            href={`/garden/${area.id}`}
            aria-label={`Abrir área da vida ${area.name}`}
            className="p-2 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        )}
      </div>
    );
  }
}
