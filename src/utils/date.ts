/**
 * Formata uma string de data ISO para o padrão brasileiro (DD/MM/AAAA).
 * Retorna um fallback seguro caso a data seja inválida ou vazia.
 */
export function formatFriendlyDate(isoString: string | undefined | null): string {
  if (!isoString) return 'Sem data';
  
  try {
    const date = new Date(isoString);
    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    
    // Formata usando a data local brasileira
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return 'Data inválida';
  }
}
