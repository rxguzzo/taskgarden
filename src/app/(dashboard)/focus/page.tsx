import React from 'react';
import { redirect } from 'next/navigation';
import { getServerClient } from '../../../services/supabase/server';
import { FocusTimer } from '../../../components/focus/FocusTimer';
import { Task, LifeArea } from '../../../domain/growth/types';

export const revalidate = 0;

export interface RecentTimerSession {
  id: string;
  duration_minutes: number;
  worked_at: string;
  note: string | null;
  created_at: string;
  task_id: string;
  tasks: {
    title: string;
  } | null;
}

export default async function FocusPage() {
  const supabase = await getServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // 1. Buscar Áreas da Vida do usuário logado
  const { data: lifeAreas, error: areasError } = await supabase
    .from('life_areas')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (areasError) {
    console.error('Erro ao buscar áreas de vida para a tela de foco:', areasError);
  }

  // 2. Buscar tarefas ativas (ACTIVE)
  const { data: activeTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (tasksError) {
    console.error('Erro ao buscar tarefas ativas para a tela de foco:', tasksError);
  }

  // 3. Buscar as últimas 5 sessões de foco do tipo TIMER de hoje
  const { data: recentSessions, error: sessionsError } = await supabase
    .from('work_sessions')
    .select(`
      id,
      duration_minutes,
      worked_at,
      note,
      created_at,
      task_id,
      tasks (
        title
      )
    `)
    .eq('user_id', user.id)
    .eq('source', 'TIMER')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5);

  if (sessionsError) {
    console.error('Erro ao carregar últimas sessões de foco:', sessionsError);
  }

  interface RawSession {
    id: string;
    duration_minutes: number;
    worked_at: string;
    note: string | null;
    created_at: string;
    task_id: string;
    tasks: { title: string } | Array<{ title: string }> | null;
  }

  // Mapear arrays garantindo fallbacks vazios seguros
  const safeAreas: LifeArea[] = lifeAreas || [];
  const safeTasks: Task[] = activeTasks || [];

  // Tratando o tipo retornado pelo select com relacionamento do Supabase
  const rawSessions = (recentSessions || []) as unknown as RawSession[];
  const safeSessions: RecentTimerSession[] = rawSessions.map((s) => {
    // Caso o relacionamento tasks retorne array ao invés de objeto (dependendo da versão/esquema do postgrest)
    const taskData = Array.isArray(s.tasks) ? s.tasks[0] : s.tasks;
    return {
      id: s.id,
      duration_minutes: s.duration_minutes,
      worked_at: s.worked_at,
      note: s.note,
      created_at: s.created_at,
      task_id: s.task_id,
      tasks: taskData ? { title: taskData.title } : null,
    };
  });

  return (
    <div className="space-y-8 max-w-2xl mx-auto text-center animate-fade-in">
      <div className="text-left">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Sessão de Foco (Regar)</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">Dedique tempo focado e faça sua planta crescer em tempo real</p>
      </div>

      <FocusTimer
        activeTasks={safeTasks}
        lifeAreas={safeAreas}
        recentSessions={safeSessions}
      />
    </div>
  );
}
