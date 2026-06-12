import React from 'react';
import { Card } from '../../../components/ui/Card';
import { getSupabaseConfig } from '../../../services/supabase/config';

export default function SettingsPage() {
  const supabaseConfig = getSupabaseConfig();

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-fade-in">
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
              Para conectar ao banco de dados definitivo do Supabase Cloud, crie o arquivo <code>.env.local</code> na raiz do projeto e configure as chaves públicas conforme as instruções no <code>README.md</code>.
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

      {/* Perfil e Conta */}
      <Card variant="glass" className="space-y-4 opacity-75">
        <h2 className="text-lg font-bold text-zinc-800 dark:text-white">👤 Perfil do Usuário</h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xl font-bold">
              U
            </div>
            <div>
              <h3 className="font-bold text-zinc-800 dark:text-white">Usuário Demo</h3>
              <p className="text-xs text-zinc-500">demo@taskgarden.com</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">Fuso Horário</label>
              <input
                type="text"
                value="America/Sao_Paulo (GMT-3)"
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 text-sm cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">Conta Criada</label>
              <input
                type="text"
                value="12 de Junho de 2026"
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 text-sm cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
