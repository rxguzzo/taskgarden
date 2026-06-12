import { redirect } from 'next/navigation';

export default function RootPage() {
  /**
   * NOTA DO MVP: Redirecionamento provisório para a tela do Jardim (/garden).
   * 
   * Esta lógica de redirecionamento imediato é provisória para o desenvolvimento da fundação.
   * Quando o módulo de autenticação com Supabase Cloud for implementado, o fluxo de rotas protegidas
   * verificará a sessão do usuário no servidor e redirecionará para '/login' se nenhuma sessão for encontrada.
   */
  redirect('/garden');
}
