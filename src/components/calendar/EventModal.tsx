'use client';

import React, { useActionState, useEffect } from 'react';
import { LifeArea } from '../../domain/growth/types';
import { TreeLoading } from '../ui/TreeLoading';
import { createEventAction } from '../../app/(dashboard)/calendar/actions';
import { getTodayDateOnly } from '../../utils/date';

interface EventModalProps {
  lifeAreas: LifeArea[];
  onClose: () => void;
  initialDate?: string; // YYYY-MM-DD
}

export function EventModal({ lifeAreas, onClose, initialDate }: EventModalProps) {
  const [state, formAction, isPending] = useActionState(createEventAction, null);

  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state, onClose]);

  // Data padrão é a data inicial passada ou a data local de hoje
  const defaultDate = initialDate || getTodayDateOnly();

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop-in">
      <div className="bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-scale-up">
        {/* Botão Fechar X */}
        <button
          onClick={onClose}
          disabled={isPending}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          type="button"
          aria-label="Fechar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
            Novo Evento Pontual
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Agende um compromisso ou designação em uma data e horário marcados.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="bg-red-500/10 text-red-800 dark:text-red-350 p-3 rounded-xl text-xs border border-red-500/20">
              ⚠️ {state.error}
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="title">
              Título do Evento *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="Ex: Reunião de Limpeza do Salão"
              disabled={isPending}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="description">
              Descrição (Opcional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              placeholder="Notas, local ou detalhes do compromisso..."
              disabled={isPending}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Área da Vida */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="life_area_id">
              Área da Vida *
            </label>
            <select
              id="life_area_id"
              name="life_area_id"
              required
              disabled={isPending}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">Selecione uma área de cultivo...</option>
              {lifeAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="event_date">
                Data *
              </label>
              <input
                id="event_date"
                name="event_date"
                type="date"
                required
                defaultValue={defaultDate}
                disabled={isPending}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="event_time">
                Horário (Opcional)
              </label>
              <input
                id="event_time"
                name="event_time"
                type="time"
                disabled={isPending}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isPending}
              type="button"
              className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-500 hover:text-zinc-650 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <TreeLoading size="sm" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Criar Evento</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
