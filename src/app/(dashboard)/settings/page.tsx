'use client';

import React, { useState, useEffect, useActionState } from 'react';
import { Card } from '../../../components/ui/Card';
import { getSupabaseConfig } from '../../../services/supabase/config';
import { getBrowserClient } from '../../../services/supabase/browser';
import { updateProfileAction, signOutAction } from './actions';
import { ProfileData } from '../../../components/layout/Sidebar';

export default function SettingsPage() {
  const supabaseConfig = getSupabaseConfig();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [email, setEmail] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Carregar dados de perfil no cliente para preencher o formulário
  useEffect(() => {
    async function loadProfileData() {
      try {
        const supabase = getBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email || '');
          const { data } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url, timezone')
            .eq('id', user.id)
            .single();

          if (data) {
            setProfile(data as ProfileData);
          }
        }
      } catch (err: unknown) {
        console.error('Erro ao carregar perfil em configurações:', err);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfileData();
  }, []);

  // useActionState para atualização do perfil com validações seguras no servidor
  const [state, formAction, isPending] = useActionState(updateProfileAction, null);

  // Lista básica de fusos horários para o select do fuso horário
  const timezones = [
    'America/Sao_Paulo',
    'America/Noronha',
    'America/Belem',
    'America/Fortaleza',
    'America/Recife',
    'America/Araguaina',
    'America/Maceio',
    'America/Bahia',
    'America/Rio_Branco',
    'America/Manaus',
    'America/Porto_Velho',
    'America/Boa_Vista',
    'America/Cuiaba',
    'America/Campo_Grande',
    'UTC',
  ];

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Configurações</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">Gerencie suas preferências de conta, preferências visuais e integrações</p>
      </div>

      {/* Seção Supabase Status */}
      <Card variant="glass" className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
          🌐 Integração Supabase Cloud
        </h2>

        {supabaseConfig.isConfigured ? (
          <div className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl text-sm border border-emerald-500/20 space-y-2">
            <p className="font-semibold flex items-center gap-1.5">
              ✅ Status: Conectado com sucesso!
            </p>
            <p className="text-xs opacity-90">
              As variáveis de ambiente do Supabase estão configuradas e prontas no arquivo <code>.env.local</code>.
            </p>
          </div>
        ) : (
          <div className="bg-amber-500/10 text-amber-800 dark:text-amber-300 p-4 rounded-xl text-sm border border-amber-500/20 space-y-2">
            <p className="font-semibold flex items-center gap-1.5">
              ⚠️ Status: Supabase não configurado
            </p>
            <p className="text-xs opacity-90 leading-relaxed">
              Interface demonstrativa disponível. O aplicativo está rodando de forma isolada com dados locais.
              Para conectar ao banco de dados definitivo do Supabase Cloud, crie o arquivo <code>.env.local</code> na raiz do projeto.
            </p>
          </div>
        )}

        <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
          <p>
            URL do projeto: <code>{supabaseConfig.url || 'Não configurada'}</code>
          </p>
          <p>
            Chave pública: <code>{supabaseConfig.key ? '••••••••••••••••' : 'Não configurada'}</code>
          </p>
        </div>
      </Card>

      {/* Perfil e Conta - Funcional */}
      <Card variant="glass" className="space-y-6">
        <h2 className="text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
          👤 Perfil e Conta
        </h2>

        {loadingProfile ? (
          <div className="py-4 text-center text-sm text-zinc-500">
            Carregando dados de perfil...
          </div>
        ) : (
          <form action={formAction} className="space-y-6">
            {state?.error && (
              <div className="bg-red-500/10 text-red-800 dark:text-red-300 p-4 rounded-xl text-xs border border-red-500/20">
                ⚠️ {state.error}
              </div>
            )}

            {state?.success && (
              <div className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl text-xs border border-emerald-500/20">
                🎉 {state.message}
              </div>
            )}

            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xl font-bold">
                  {(profile?.display_name || 'J').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-bold text-zinc-800 dark:text-white">
                  {profile?.display_name || 'Jardineiro'}
                </h3>
                <p className="text-xs text-zinc-500">{email || 'Sem email cadastrado'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="display_name">
                  Nome de Exibição
                </label>
                <input
                  id="display_name"
                  name="display_name"
                  type="text"
                  required
                  disabled={isPending}
                  defaultValue={profile?.display_name || ''}
                  placeholder="Seu nome no jogo"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="timezone">
                  Fuso Horário
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  required
                  disabled={isPending}
                  defaultValue={profile?.timezone || 'America/Sao_Paulo'}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1" htmlFor="avatar_url">
                URL do Avatar (Opcional)
              </label>
              <input
                id="avatar_url"
                name="avatar_url"
                type="url"
                disabled={isPending}
                defaultValue={profile?.avatar_url || ''}
                placeholder="https://exemplo.com/suaimagem.png"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-2.5 px-6 rounded-xl shadow-md transition-colors text-sm"
              >
                {isPending ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        )}
      </Card>

      {/* Preferências Visuais e Tema */}
      <Card variant="glass" className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-800 dark:text-white">🎨 Tema & Estilo Visual</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-950/20 cursor-not-allowed">
            <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Modo de Exibição</h3>
            <p className="text-xs text-zinc-500 mt-1">Seguir as configurações do sistema operacional</p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-950/20 cursor-not-allowed">
            <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Redução de Movimento</h3>
            <p className="text-xs text-zinc-500 mt-1">Sway e vento nas plantas serão desativados se ativo no OS</p>
          </div>
        </div>
      </Card>

      {/* Ações de Conta */}
      <Card variant="glass" className="space-y-4 border-red-500/20 bg-red-500/5">
        <h2 className="text-lg font-bold text-red-800 dark:text-red-400">⚠️ Ações da Conta</h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Encerre sua sessão no dispositivo atual de forma segura.
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={async () => {
              if (confirm('Deseja realmente sair da sua conta?')) {
                await signOutAction();
              }
            }}
            aria-label="Sair da conta"
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-6 rounded-xl shadow-md transition-colors text-sm"
          >
            Sair da Conta
          </button>
        </div>
      </Card>
    </div>
  );
}
