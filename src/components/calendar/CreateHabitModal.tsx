'use client';

import React, { useActionState, useEffect } from 'react';
import { LifeArea, HabitFrequency } from '../../domain/growth/types';
import { TreeLoading } from '../ui/TreeLoading';
import { createHabitAction } from '../../app/(dashboard)/calendar/actions';

interface CreateHabitModalProps {
  lifeAreas: LifeArea[];
  onClose: () => void;
}

const WEEKDAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' }
];

export function CreateHabitModal({ lifeAreas, onClose }: CreateHabitModalProps) {
  const [state, formAction, isPending] = useActionState(createHabitAction, null);

  const [frequency, setFrequency] = React.useState<HabitFrequency>('DAILY');

  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state, onClose]);

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop-in">
      <div className="bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-scale-up">
        {/* Botão Fechar X */}
        <button
          onClick={onClose}
          disabled={isPending}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Nova Rotina</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Crie tarefas recorrentes que aparecem nos dias programados.</p>
        </div>

        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="bg-red-500/10 text-red-800 dark:text-red-350 p-3 rounded-xl text-xs border border-red-500/20">
              ⚠️ {state.error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="title">
              Título da Rotina *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="Ex: Treinar programação"
              disabled={isPending}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
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
              placeholder="Descrição ou notas adicionais..."
              disabled={isPending}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                <option value="">Selecione...</option>
                {lifeAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="frequency">
                Frequência *
              </label>
              <select
                id="frequency"
                name="frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
                disabled={isPending}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="DAILY">Todos os dias</option>
                <option value="WEEKDAYS">Segunda a sexta</option>
                <option value="CUSTOM_WEEKLY">Dias específicos</option>
                <option value="WEEKLY">Toda semana</option>
                <option value="MONTHLY">Mensal</option>
              </select>
            </div>
          </div>

          {/* Frequência Customizada Semanal */}
          {frequency === 'CUSTOM_WEEKLY' && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-500">
                Selecione os dias da semana *
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {WEEKDAYS.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer hover:border-emerald-500/30 transition-all select-none"
                  >
                    <input
                      type="checkbox"
                      name="custom_days"
                      value={day.value}
                      disabled={isPending}
                      className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500 accent-emerald-650 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span>{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Frequência Mensal */}
          {frequency === 'MONTHLY' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="day_of_month">
                Dia do Mês *
              </label>
              <input
                id="day_of_month"
                name="day_of_month"
                type="number"
                min={1}
                max={31}
                required
                placeholder="Ex: 1"
                disabled={isPending}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Se o mês não possuir o dia escolhido (ex: dia 31 em fevereiro), a rotina não aparecerá nesse mês.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-zinc-650 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center min-w-[120px] disabled:cursor-not-allowed"
            >
              {isPending ? (
                <TreeLoading label="Salvando..." size="sm" />
              ) : (
                'Salvar Rotina'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
