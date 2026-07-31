'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/Card';
import { LifeAreaEvent } from '../../domain/growth/types';
import { toggleEventCompletionAction, archiveEventAction } from '../../app/(dashboard)/calendar/actions';
import { getTodayDateOnly, formatDateOnlyBr } from '../../utils/date';

interface AreaEventsListProps {
  events: LifeAreaEvent[];
  lifeAreaId: string;
}

type TabType = 'TODAY' | 'UPCOMING' | 'COMPLETED';

export function AreaEventsList({ events, lifeAreaId }: AreaEventsListProps) {
  const [localEvents, setLocalEvents] = useState<LifeAreaEvent[]>(events);
  const [pendingEventActionIds, setPendingEventActionIds] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<TabType>('TODAY');

  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  const todayStr = getTodayDateOnly();

  // Handler para marcar/desmarcar conclusão de evento pontual com UI otimista
  const handleToggleEvent = async (eventId: string) => {
    if (pendingEventActionIds[eventId]) return;
    setPendingEventActionIds(prev => ({ ...prev, [eventId]: true }));

    const previousEvents = [...localEvents];

    // Atualização otimista local
    setLocalEvents(prev =>
      prev.map(evt => {
        if (evt.id === eventId) {
          const isCompleted = evt.status === 'COMPLETED';
          return {
            ...evt,
            status: isCompleted ? 'PENDING' : 'COMPLETED',
            completed_at: isCompleted ? null : new Date().toISOString()
          };
        }
        return evt;
      })
    );

    try {
      const res = await toggleEventCompletionAction(eventId);
      if (!res.success) {
        setLocalEvents(previousEvents);
        alert(res.error || 'Erro ao atualizar evento.');
      }
    } catch {
      setLocalEvents(previousEvents);
      alert('Erro de conexão ao atualizar evento.');
    } finally {
      setPendingEventActionIds(prev => ({ ...prev, [eventId]: false }));
    }
  };

  // Handler para arquivar evento pontual com UI otimista
  const handleArchiveEvent = async (eventId: string) => {
    if (pendingEventActionIds[eventId]) return;
    if (!confirm('Deseja realmente arquivar este evento?')) return;

    setPendingEventActionIds(prev => ({ ...prev, [eventId]: true }));
    const previousEvents = [...localEvents];

    // Atualização otimista local (remove da lista)
    setLocalEvents(prev => prev.filter(evt => evt.id !== eventId));

    try {
      const res = await archiveEventAction(eventId);
      if (!res.success) {
        setLocalEvents(previousEvents);
        alert(res.error || 'Erro ao arquivar evento.');
      }
    } catch {
      setLocalEvents(previousEvents);
      alert('Erro de conexão ao arquivar evento.');
    } finally {
      setPendingEventActionIds(prev => ({ ...prev, [eventId]: false }));
    }
  };

  // Filtra eventos ativos (não arquivados / deletados) para esta Área da Vida específica
  const activeEvents = useMemo(() => {
    return localEvents.filter(e => e.life_area_id === lifeAreaId && e.status !== 'ARCHIVED' && e.deleted_at === null);
  }, [localEvents, lifeAreaId]);

  // Segmentação por abas
  const tabFilteredEvents = useMemo(() => {
    switch (activeTab) {
      case 'TODAY':
        return activeEvents
          .filter(e => e.event_date === todayStr && e.status !== 'COMPLETED')
          .sort((a, b) => (a.event_time || '').localeCompare(b.event_time || ''));
      case 'UPCOMING':
        return activeEvents
          .filter(e => e.event_date > todayStr && e.status !== 'COMPLETED')
          .sort((a, b) => {
            const dateCompare = a.event_date.localeCompare(b.event_date);
            if (dateCompare !== 0) return dateCompare;
            return (a.event_time || '').localeCompare(b.event_time || '');
          });
      case 'COMPLETED':
        return activeEvents
          .filter(e => e.status === 'COMPLETED')
          .sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''));
      default:
        return [];
    }
  }, [activeEvents, activeTab, todayStr]);

  // Contadores
  const countToday = activeEvents.filter(e => e.event_date === todayStr && e.status !== 'COMPLETED').length;
  const countUpcoming = activeEvents.filter(e => e.event_date > todayStr && e.status !== 'COMPLETED').length;
  const countCompleted = activeEvents.filter(e => e.status === 'COMPLETED').length;

  return (
    <Card variant="solid" className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-100 dark:border-zinc-900 pb-3 gap-3">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          📅 Eventos do Cultivo ({activeEvents.length})
        </h3>

        {/* Abas */}
        <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 text-xs shrink-0 select-none">
          <button
            onClick={() => setActiveTab('TODAY')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
              activeTab === 'TODAY'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-450 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-650'
            }`}
          >
            Hoje ({countToday})
          </button>
          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
              activeTab === 'UPCOMING'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-450 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-650'
            }`}
          >
            Próximos ({countUpcoming})
          </button>
          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
              activeTab === 'COMPLETED'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-450 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-650'
            }`}
          >
            Concluídos ({countCompleted})
          </button>
        </div>
      </div>

      {tabFilteredEvents.length === 0 ? (
        <div className="text-sm text-zinc-400 dark:text-zinc-550 py-8 text-center font-medium border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
          Nenhum evento nesta categoria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {tabFilteredEvents.map(event => {
            const completed = event.status === 'COMPLETED';
            const isActionPending = !!pendingEventActionIds[event.id];

            return (
              <div
                key={event.id}
                className={`bg-white/80 dark:bg-zinc-900/80 border rounded-2xl p-4 flex gap-4 items-center justify-between shadow-sm transition-all hover:border-emerald-500/20 group relative overflow-hidden ${
                  completed ? 'border-zinc-200/40 dark:border-zinc-850/40 opacity-75' : 'border-zinc-200/60 dark:border-zinc-800/80'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Checkbox de Conclusão Otimista */}
                  <button
                    onClick={() => handleToggleEvent(event.id)}
                    disabled={isActionPending}
                    aria-label={`Concluir evento: ${event.title}`}
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

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`text-sm font-bold truncate flex-1 min-w-[120px] ${
                        completed ? 'line-through text-zinc-450 dark:text-zinc-550' : 'text-zinc-850 dark:text-zinc-200'
                      }`}>
                        {event.title}
                      </h4>
                      {event.event_time && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/10 text-emerald-600 dark:text-emerald-450 bg-emerald-500/5 flex items-center gap-1">
                          ⏰ {event.event_time.substring(0, 5)}
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-200/40 text-zinc-500 dark:text-zinc-450 bg-zinc-100/50 dark:bg-zinc-850/40">
                        📅 {formatDateOnlyBr(event.event_date)}
                      </span>
                    </div>

                    {event.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                        {event.description}
                      </p>
                    )}

                    <span className={`inline-block text-[9px] font-bold ${completed ? 'text-emerald-600 dark:text-emerald-450' : 'text-zinc-450 dark:text-zinc-500'}`}>
                      {completed ? '✓ Concluído' : '○ Pendente'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleArchiveEvent(event.id)}
                    disabled={isActionPending}
                    title="Arquivar evento"
                    aria-label={`Arquivar evento: ${event.title}`}
                    className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-950/20 rounded-lg transition-all shrink-0"
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
    </Card>
  );
}
