import React from 'react';
import Link from 'next/link';
import { Card } from '../components/ui/Card';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-4">
      <Card variant="glass" className="w-full max-w-md text-center p-8 space-y-6 shadow-lg">
        <div className="space-y-2">
          <div className="text-6xl" role="img" aria-label="Planta murcha">
            🥀
          </div>
          <h1 className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 tracking-tight mt-4">
            Área Não Encontrada
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Parece que você seguiu uma trilha que não existe no nosso mapa de cultivo. A semente que você procura não está plantada neste jardim.
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/garden"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-xl shadow-md transition-colors text-sm"
          >
            Voltar para o Jardim
          </Link>
        </div>
      </Card>
    </div>
  );
}
