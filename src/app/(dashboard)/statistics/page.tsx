import React from 'react';
import { Card } from '../../../components/ui/Card';

export default function StatisticsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Estatísticas do Cultivo</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">Monitore seu foco, constância e o crescimento do seu jardim</p>
        </div>

        <div className="bg-amber-500/10 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-2xl border border-amber-500/20 text-xs max-w-sm">
          ⚠️ **Dados Demonstrativos**: Esta tela exibe dados de exemplo estatísticos da fundação estrutural do MVP.
        </div>
      </div>

      {/* Grid de Indicadores Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" className="p-6">
          <span className="text-xs font-semibold text-zinc-500 uppercase">Horas Dedicadas (Semana)</span>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">12h 40m</p>
          <span className="text-[10px] text-zinc-400 mt-1 block">↑ 15% em relação à semana passada</span>
        </Card>
        
        <Card variant="glass" className="p-6">
          <span className="text-xs font-semibold text-zinc-500 uppercase">Eficiência de Foco</span>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">88%</p>
          <span className="text-[10px] text-zinc-400 mt-1 block">Média de 22 minutos por sessão</span>
        </Card>

        <Card variant="glass" className="p-6">
          <span className="text-xs font-semibold text-zinc-500 uppercase">Taxa de Colheita</span>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">80%</p>
          <span className="text-[10px] text-zinc-400 mt-1 block">4 colheitas / 1 poda</span>
        </Card>

        <Card variant="glass" className="p-6">
          <span className="text-xs font-semibold text-zinc-500 uppercase">Pontos Acumulados</span>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">1.125 XP</p>
          <span className="text-[10px] text-zinc-400 mt-1 block">Nível de Cultivador Experiente</span>
        </Card>
      </div>

      {/* Seção Gráficos de Dedicação */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Horas por Categoria */}
        <Card variant="glass" className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-zinc-800 dark:text-white">Foco por Categoria</h3>
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Trabalho (8h 15m)</span>
                <span className="font-semibold text-emerald-600">65%</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Estudos (3h 10m)</span>
                <span className="font-semibold text-emerald-500">25%</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Saúde (1h 15m)</span>
                <span className="font-semibold text-emerald-400">10%</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Dedicação Diária Semanal */}
        <Card variant="glass" className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-zinc-800 dark:text-white">Minutos de Foco (Últimos 7 dias)</h3>
          
          <div className="h-44 flex items-end gap-3 pt-6 px-2">
            {[
              { day: 'Sáb', min: 45 },
              { day: 'Dom', min: 0 },
              { day: 'Seg', min: 90 },
              { day: 'Ter', min: 120 },
              { day: 'Qua', min: 60 },
              { day: 'Qui', min: 150 },
              { day: 'Sex', min: 75 }
            ].map((d, index) => {
              const maxMin = 150;
              const heightPct = (d.min / maxMin) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {d.min > 0 ? `${d.min}m` : '-'}
                  </span>
                  <div 
                    className="w-full bg-emerald-500/80 rounded-t-lg transition-all hover:bg-emerald-600 cursor-pointer"
                    style={{ height: d.min > 0 ? `${heightPct}%` : '4px' }}
                  />
                  <span className="text-xs font-semibold text-zinc-500">{d.day}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
