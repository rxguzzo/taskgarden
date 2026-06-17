'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card } from '../ui/Card';
import { formatFriendlyDate } from '../../utils/date';
import { Task, LifeArea } from '../../domain/growth/types';
import { RecentTimerSession } from '../../app/(dashboard)/focus/page';
import { createTimerSessionAction } from '../../app/(dashboard)/work-sessions/actions';

interface FocusTimerProps {
  activeTasks: Task[];
  lifeAreas: LifeArea[];
  recentSessions: RecentTimerSession[];
}

type TimerStatus = 'IDLE' | 'RUNNING' | 'PAUSED';

export function FocusTimer({ activeTasks, lifeAreas, recentSessions }: FocusTimerProps) {
  // Presets disponíveis em minutos
  const presets = [15, 25, 45, 60];
  const [presetMinutes, setPresetMinutes] = useState(25);
  
  // Estados do timer
  const [status, setStatus] = useState<TimerStatus>('IDLE');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [selectedTaskId, setSelectedTaskId] = useState(activeTasks[0]?.id || '');
  const [note, setNote] = useState('');
  
  // Feedback do servidor
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Referência para o intervalo
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Atualiza a tarefa selecionada caso a lista mude (ex: carregamento inicial assíncrono)
  useEffect(() => {
    if (activeTasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(activeTasks[0].id);
    }
  }, [activeTasks, selectedTaskId]);

  // Efeito do beforeunload para evitar sair acidentalmente
  useEffect(() => {
    const shouldWarn = (status === 'RUNNING' || status === 'PAUSED') && elapsedSeconds > 0;
    if (!shouldWarn) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Você tem uma sessão de foco ativa. Se sair agora, o tempo não será salvo.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [status, elapsedSeconds]);

  // Efeito principal do timer
  useEffect(() => {
    if (status === 'RUNNING') {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            // Fim do tempo do preset
            if (intervalRef.current) clearInterval(intervalRef.current);
            setStatus('PAUSED'); // Pausa ao chegar no 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status]);

  // Trata a alteração do preset
  const handleSelectPreset = (minutes: number) => {
    if (status !== 'IDLE') return; // Bloqueado se já iniciado
    setPresetMinutes(minutes);
    setRemainingSeconds(minutes * 60);
    setElapsedSeconds(0);
    setError(null);
    setSuccessMessage(null);
  };

  // Trata os controles do timer
  const handleStart = () => {
    if (activeTasks.length === 0) {
      setError('Por favor, crie uma tarefa ativa antes de iniciar.');
      return;
    }
    if (!selectedTaskId) {
      setError('Selecione uma tarefa ativa para focar.');
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setStatus('RUNNING');
  };

  const handlePause = () => {
    setStatus('PAUSED');
  };

  const handleCancel = () => {
    if (window.confirm('Tem certeza que deseja cancelar esta sessão de foco? Todo o tempo decorrido será perdido.')) {
      setStatus('IDLE');
      setElapsedSeconds(0);
      setRemainingSeconds(presetMinutes * 60);
      setNote('');
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleConcluir = async () => {
    setError(null);
    setSuccessMessage(null);

    // Validação de tempo mínimo (60 segundos)
    if (elapsedSeconds < 60) {
      setError('A sessão precisa ter pelo menos 1 minuto para ser registrada.');
      return;
    }

    if (!selectedTaskId) {
      setError('Selecione uma tarefa ativa.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('task_id', selectedTaskId);
      
      // Salva apenas o tempo realmente decorrido arredondado para baixo
      const durationMinutes = Math.floor(elapsedSeconds / 60);
      formData.append('duration_minutes', durationMinutes.toString());
      formData.append('note', note);

      const result = await createTimerSessionAction(null, formData);
      
      if (result.success) {
        setSuccessMessage(result.message || 'Foco registrado e planta regada com sucesso!');
        // Reset do timer
        setStatus('IDLE');
        setElapsedSeconds(0);
        setRemainingSeconds(presetMinutes * 60);
        setNote('');
      } else {
        setError(result.error || 'Erro ao salvar a sessão de foco no servidor.');
      }
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro inesperado ao salvar a sessão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatação MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cálculo do progresso circular SVG
  // Raio = 90, Circunferência = 2 * PI * 90 = 565.487
  const r = 90;
  const c = 2 * Math.PI * r;
  const totalTargetSeconds = presetMinutes * 60;
  
  // Determina a porcentagem de tempo que resta para preencher o círculo
  const percentage = totalTargetSeconds > 0 ? remainingSeconds / totalTargetSeconds : 0;
  const strokeDashoffset = c * (1 - percentage);

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Card variant="glass" className="space-y-8 py-10 relative overflow-hidden">
        {/* Banner de Estado Vazio */}
        {activeTasks.length === 0 ? (
          <div className="space-y-6 max-w-md mx-auto text-center py-4">
            <div className="w-16 h-16 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto text-3xl">
              ⚠️
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Sem sementes ativas no Jardim</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Você não possui nenhuma semente (tarefa) ativa no momento. Para iniciar uma sessão de foco e regar suas plantas, você precisa criar uma tarefa primeiro.
              </p>
            </div>
            <Link
              href="/garden"
              className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Ir para o Meu Jardim
            </Link>
          </div>
        ) : (
          <>
            {/* Selecionador de Sementes */}
            <div className="max-w-md mx-auto space-y-2 text-left">
              <label htmlFor="task-select" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                Selecionar Semente para Regar:
              </label>
              <select
                id="task-select"
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                disabled={status !== 'IDLE'}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-zinc-800 dark:text-zinc-200"
              >
                {activeTasks.map((task) => {
                  const area = lifeAreas.find((a) => a.id === task.life_area_id);
                  const areaLabel = area ? area.name : 'Área Geral';
                  return (
                    <option key={task.id} value={task.id}>
                      🌱 {task.title} ({areaLabel})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Lista de Subtarefas da Tarefa em Foco */}
            {(() => {
              const currentTask = activeTasks.find(t => t.id === selectedTaskId);
              const taskSubtasks = currentTask?.subtasks || [];
              if (taskSubtasks.length === 0) return null;

              const completedCount = taskSubtasks.filter(s => s.is_completed).length;
              const totalCount = taskSubtasks.length;
              const completionRate = Math.round((completedCount / totalCount) * 100);

              return (
                <div className="max-w-md mx-auto p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 text-left space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Subtarefas da Semente:
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {completedCount}/{totalCount} ({completionRate}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                  <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {taskSubtasks.map((sub) => (
                      <li key={sub.id} className="flex items-start gap-2 text-xs text-zinc-650 dark:text-zinc-350">
                        <span className={`text-[10px] select-none mt-0.5 ${sub.is_completed ? 'text-emerald-500 font-bold' : 'text-zinc-350 dark:text-zinc-650'}`}>
                          {sub.is_completed ? '✓' : '○'}
                        </span>
                        <span className={sub.is_completed ? 'line-through text-zinc-400 dark:text-zinc-550' : ''}>
                          {sub.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}

            {/* Seleção de Presets de Tempo */}
            <div className="max-w-md mx-auto space-y-2 text-left">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                Meta da Sessão:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {presets.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => handleSelectPreset(minutes)}
                    disabled={status !== 'IDLE'}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      presetMinutes === minutes
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                        : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
            </div>

            {/* Cronômetro Circular Animado */}
            <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
              {/* Círculo de progresso SVG */}
              <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 200 200">
                {/* Trilho de Fundo */}
                <circle
                  cx="100"
                  cy="100"
                  r={r}
                  className="stroke-zinc-100 dark:stroke-zinc-850 fill-none"
                  strokeWidth="8"
                />
                {/* Linha de Progresso */}
                <circle
                  cx="100"
                  cy="100"
                  r={r}
                  className="stroke-emerald-500 dark:stroke-emerald-400 fill-none transition-all duration-1000 linear"
                  strokeWidth="8"
                  strokeDasharray={c}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>

              {/* Informações Centrais */}
              <div className="flex flex-col items-center justify-center z-10">
                <span className="text-5xl font-mono font-bold text-zinc-85 leading-none text-zinc-800 dark:text-zinc-100">
                  {formatTime(remainingSeconds)}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-widest mt-3">
                  {status === 'RUNNING' ? 'Foco Ativo' : status === 'PAUSED' ? 'Pausado' : 'Pronto'}
                </span>
                {elapsedSeconds > 0 && (
                  <span className="text-[10px] text-zinc-500 mt-2 bg-zinc-100 dark:bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-200/40 dark:border-zinc-800/40 font-mono">
                    Decorridos: {formatTime(elapsedSeconds)}
                  </span>
                )}
              </div>
            </div>

            {/* Controles de Foco */}
            <div className="flex justify-center items-center gap-4 max-w-sm mx-auto">
              {status === 'IDLE' && (
                <button
                  type="button"
                  onClick={handleStart}
                  className="w-16 h-16 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-950/10 hover:shadow-emerald-950/20 transition-all transform hover:scale-105 cursor-pointer"
                  title="Iniciar Cronômetro"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 ml-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 0 1 0 1.971l-11.54 6.347a1.125 1.125 0 0 1-1.667-.985V5.653Z" />
                  </svg>
                </button>
              )}

              {status !== 'IDLE' && (
                <>
                  {/* Botão Cancelar */}
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="w-12 h-12 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-full transition-all cursor-pointer border border-zinc-200/50 dark:border-zinc-800/50 disabled:opacity-50"
                    title="Cancelar Foco"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Botão Play / Pause */}
                  {status === 'RUNNING' ? (
                    <button
                      type="button"
                      onClick={handlePause}
                      disabled={isSubmitting}
                      className="w-16 h-16 flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg shadow-amber-950/10 hover:shadow-amber-950/20 transition-all transform hover:scale-105 cursor-pointer disabled:opacity-50"
                      title="Pausar Foco"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setStatus('RUNNING')}
                      disabled={isSubmitting}
                      className="w-16 h-16 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-950/10 hover:shadow-emerald-950/20 transition-all transform hover:scale-105 cursor-pointer disabled:opacity-50"
                      title="Retomar Foco"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 ml-0.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 0 1 0 1.971l-11.54 6.347a1.125 1.125 0 0 1-1.667-.985V5.653Z" />
                      </svg>
                    </button>
                  )}

                  {/* Botão Concluir Foco */}
                  <button
                    type="button"
                    onClick={handleConcluir}
                    disabled={isSubmitting || elapsedSeconds < 60}
                    className="w-12 h-12 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-all cursor-pointer border border-emerald-400/20 disabled:opacity-50 disabled:bg-zinc-100 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-650"
                    title={elapsedSeconds < 60 ? 'Foque pelo menos 1 minuto para concluir' : 'Concluir Foco'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Observações da Sessão */}
            <div className="max-w-md mx-auto text-left space-y-2">
              <label htmlFor="focus-note" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block">
                O que foi realizado nesta sessão? (Opcional)
              </label>
              <input
                id="focus-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: Escrevi os primeiros parágrafos do relatório"
                maxLength={1000}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </>
        )}

        {/* Mensagens de Feedback */}
        {error && (
          <div className="max-w-md mx-auto bg-red-500/10 dark:bg-red-950/20 text-red-800 dark:text-red-300 p-4 rounded-xl text-xs text-left border border-red-500/20 animate-fade-in">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="max-w-md mx-auto bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-350 p-4 rounded-xl text-xs text-left border border-emerald-500/20 animate-fade-in">
            {successMessage}
          </div>
        )}
      </Card>

      {/* Histórico rápido de foco de hoje */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 tracking-tight text-left">
          Últimas Sessões de Foco do Dia
        </h2>
        
        {recentSessions.length === 0 ? (
          <div className="text-center py-8 bg-zinc-50/50 dark:bg-zinc-950/30 rounded-2xl border border-zinc-100 dark:border-zinc-900 border-dashed text-zinc-500 dark:text-zinc-400 text-sm">
            Nenhuma sessão de foco registrada hoje. Inicie o cronômetro para ver seu histórico!
          </div>
        ) : (
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-150/40 dark:border-zinc-800/40 rounded-xl gap-3 text-left"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      🌱 {session.tasks?.title || 'Semente Excluída'}
                    </span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                      Timer
                    </span>
                  </div>
                  {session.note && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                      &ldquo;{session.note}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 self-end sm:self-center">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-400/5 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                    +{session.duration_minutes} {session.duration_minutes === 1 ? 'minuto' : 'minutos'}
                  </span>
                  <span className="text-[11px] font-mono">
                    {formatFriendlyDate(session.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
