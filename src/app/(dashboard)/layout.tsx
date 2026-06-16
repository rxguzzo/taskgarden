import React from 'react';
import { redirect } from 'next/navigation';
import { getServerClient } from '../../services/supabase/server';
import { Sidebar } from '../../components/layout/Sidebar';
import { BottomNav } from '../../components/layout/BottomNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getServerClient();

  // 1. Validar a identidade de forma segura no servidor usando getUser()
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  // 2. Consultar o perfil no servidor
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, timezone')
    .eq('id', user.id)
    .single();

  if (profileError) {
    // Tratar perfil ausente de forma segura: logar aviso no servidor
    console.warn(
      `[Segurança] Perfil ausente para o usuário autenticado ${user.id}:`,
      profileError.message
    );
  }

  // 3. Definir fallback seguro para perfil ausente (sem criar registro mockado no banco)
  const safeProfile = {
    id: user.id,
    display_name: profile?.display_name || user.email?.split('@')[0] || 'Jardineiro',
    avatar_url: profile?.avatar_url || null,
    timezone: profile?.timezone || 'America/Sao_Paulo',
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-16 md:pb-0">
      {/* Sidebar - Desktop (passando dados por props) */}
      <Sidebar profile={safeProfile} />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full max-w-[2100px] mx-auto">
          {children}
        </main>
      </div>

      {/* BottomNav - Mobile (passando dados por props) */}
      <BottomNav profile={safeProfile} />
    </div>
  );
}
