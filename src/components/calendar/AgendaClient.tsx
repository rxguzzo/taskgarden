'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Task, LifeArea } from '../../domain/growth/types';
import { Card } from '../ui/Card';
import { completeTaskAction } from '../../app/(dashboard)/tasks/actions';
import { getTodayDateOnly, toDateOnly, formatDateOnlyBr } from '../../utils/date';

interface AgendaClientProps {
  initialTasks: Task[];
  lifeAreas: LifeArea[];
}

const AREA_COLOR_MAP = {
  emerald: {
    bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30 hover:bg-emerald-500/20',
    dot: 'bg-emerald-500'
  },
  blue: {
    bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30 hover:bg-blue-500/20',
    dot: 'bg-blue-500'
  },
  purple: {
    bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30 hover:bg-purple-500/20',
    dot: 'bg-purple-500'
  },
  amber: {
    bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30 hover:bg-amber-500/20',
    dot: 'bg-amber-500'
  },
  rose: {
    bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/30 hover:bg-rose-500/20',
    dot: 'bg-rose-500'
  },
  slate: {
    bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20 dark:border-slate-500/30 hover:bg-slate-500/20',
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

export function AgendaClient({ initialTasks, lifeAreas }: AgendaClientProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  // Estados do mini-calendário
  const todayDateStr = getTodayDateOnly();
  const [currentDate, setCurrentDate] = useState(new Date());
  const calMonth = currentDate.getMonth();
  const calYear = currentDate.getFullYear();

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
      // Sem prazo ordena por prioridade
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
        badgeClass: 'text-yellow-600 dark:text-yellow-450 bg-yellow-500/10 dark:bg-yellow-550/15 border-yellow-500/20'
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
    // Células vazias do mês anterior
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }
    // Dias do mês atual
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

  // Formata o cabeçalho "Hoje no seu jardim"
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
      <Card variant="glass" className="overflow-hidden relative">
        <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10 pointer-events-none select-none">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-32 h-32 text-emerald-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        </div>
        <div className="space-y-4">
          <div>
            <span className="text-xs uppercase font-bold text-emerald-600 dark:text-emerald-450 tracking-wider">
              Hoje no seu jardim
            </span>
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white mt-0.5">
              {formattedTodayHeader()}
            </h2>
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
              <span className="text-[10px] text-zinc-400 dark:text-zinc-550 uppercase font-bold">Próximas</span>
              <p className="text-2xl font-black text-emerald-650 dark:text-emerald-450 mt-1">
                {categorizedTasks.upcoming.length}
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
        {/* Colunas de Tarefas (3/4 do espaço no desktop) */}
        <div className="lg:col-span-3 space-y-6">
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
                        : 'text-zinc-750 dark:text-zinc-300 hover:bg-zinc-150 dark:hover:bg-zinc-800'
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

          {/* Seção de Hábitos Teaser (M10.2) */}
          <Card variant="glass" className="p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-emerald-650 dark:text-emerald-450 border-b border-emerald-950/5 dark:border-white/5 pb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <h4 className="text-xs font-bold uppercase tracking-wider">Hábitos de Hoje</h4>
            </div>
            <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-dashed border-zinc-200/50 dark:border-zinc-800/40 rounded-xl p-3.5 text-center">
              <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                🔄 Hábitos estão chegando na M10.2!
              </p>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1">
                Você poderá programar tarefas recorrentes (academia, estudos, leituras) e acompanhar streaks diários.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  // Renderização individual de cada tarefa
  function renderTaskItem(task: Task) {
    const area = areasMap.get(task.life_area_id);
    const urgency = getUrgencyInfo(task.due_date);
    const priority = PRIORITY_MAP[task.priority] || { label: 'Normal', color: 'text-zinc-600 bg-zinc-100' };

    const areaColorInfo = area ? AREA_COLOR_MAP[area.color] : AREA_COLOR_MAP.slate;

    return (
      <div
        key={task.id}
        className="bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl p-4 flex gap-4 items-center justify-between shadow-sm transition-all hover:border-emerald-500/20 group relative overflow-hidden"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Checkbox de Conclusão Otimista */}
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

          {/* Dados da Tarefa */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate flex-1 min-w-[120px]">
                {task.title}
              </h4>
              {/* Badge de Urgência de Prazo */}
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${urgency.badgeClass}`}>
                {urgency.label}
              </span>
            </div>

            {task.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                {task.description}
              </p>
            )}

            {/* Badges de Atributos */}
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

        {/* Link para a área de vida correspondente */}
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
