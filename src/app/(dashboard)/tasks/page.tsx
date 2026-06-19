import React, { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerClient } from '../../../services/supabase/server';
import { CreateTaskForm } from '../../../components/tasks/CreateTaskForm';

export const revalidate = 0;

export default async function PlantTaskPage() {
  const supabase = await getServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Buscar áreas de vida ativas do usuário
  const { data: areas, error: areasError } = await supabase
    .from('life_areas')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (areasError) {
    console.error('Erro ao carregar áreas de vida:', areasError);
  }

  const activeAreas = areas || [];

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Plantar Nova Semente</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">Crie uma nova tarefa e cultive-a realizando suas atividades</p>
      </div>

      {activeAreas.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="w-16 h-16 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-4 text-2xl">
            ⚠️
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Nenhuma Área da Vida Ativa</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-md">
            Você precisa plantar pelo menos uma área da vida no seu Jardim antes de criar tarefas. Cada semente (tarefa) precisa de uma árvore (área da vida) para se apoiar.
          </p>
          <div className="mt-6">
            <Link
              href="/garden"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors inline-block"
            >
              Ir para o Jardim
            </Link>
          </div>
        </div>
      ) : (
        <Suspense fallback={<div className="animate-pulse h-96 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />}>
          <CreateTaskForm areas={activeAreas} />
        </Suspense>
      )}
    </div>
  );
}
