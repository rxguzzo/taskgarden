import React from 'react';
import { redirect } from 'next/navigation';
import { getServerClient } from '../../../services/supabase/server';
import { AgendaClient } from '../../../components/calendar/AgendaClient';
import { Task, LifeArea, Habit, HabitCompletion } from '../../../domain/growth/types';
import { getTodayDateOnly } from '../../../utils/date';

export const revalidate = 0;

export default async function CalendarPage() {
  const supabase = await getServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  const todayStr = getTodayDateOnly();

  // 1. Buscar Áreas da Vida ativas do usuário logado
  const { data: lifeAreas, error: areasError } = await supabase
    .from('life_areas')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (areasError) {
    console.error('Erro ao buscar áreas de vida para a agenda:', areasError);
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
    console.error('Erro ao buscar tarefas ativas para a agenda:', tasksError);
  }

  // 3. Buscar rotinas ativas (habits)
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (habitsError) {
    console.error('Erro ao buscar rotinas para a agenda:', habitsError);
  }

  // 4. Buscar as conclusões das rotinas de hoje
  const { data: completions, error: completionsError } = await supabase
    .from('habit_completions')
    .select('*')
    .eq('user_id', user.id)
    .eq('completed_date', todayStr);

  if (completionsError) {
    console.error('Erro ao buscar conclusões de rotinas para a agenda:', completionsError);
  }

  const safeAreas: LifeArea[] = lifeAreas || [];
  const safeTasks: Task[] = activeTasks || [];
  const safeHabits: Habit[] = habits || [];
  const safeCompletions: HabitCompletion[] = completions || [];

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Agenda Global</h1>
        <p className="text-zinc-655 dark:text-zinc-400 mt-1">
          Gerencie seus prazos e visualize todo o seu plano de cultivo de sementes.
        </p>
      </div>
      <AgendaClient
        initialTasks={safeTasks}
        lifeAreas={safeAreas}
        initialHabits={safeHabits}
        initialCompletions={safeCompletions}
      />
    </div>
  );
}
