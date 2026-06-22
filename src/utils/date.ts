/**
 * Obtém a data de hoje local do usuário no formato YYYY-MM-DD,
 * evitando discrepâncias causadas por fusos horários (como UTC).
 */
export function getTodayDateOnly(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formata uma data puramente no padrão de calendário brasileiro (DD/MM/AAAA)
 * sem sofrer qualquer alteração por fuso horário local ou UTC.
 * Aceita formatos YYYY-MM-DD e similares.
 */
export function formatDateOnlyBr(value: string | null | undefined): string {
  if (!value) return 'Sem data';

  // Tenta capturar o padrão YYYY-MM-DD no início da string
  const dateOnlyMatch = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dateOnlyMatch) {
    return 'Data inválida';
  }

  const [, year, month, day] = dateOnlyMatch;
  return `${day}/${month}/${year}`;
}

/**
 * Formata amigavelmente uma data/timestamp para exibição no padrão brasileiro (DD/MM/AAAA).
 * - Para campos de calendário (data-only ou com hora UTC zerada), mantém a data original sem desvio.
 * - Para timestamps reais de auditoria (com hora real diferente de zero), respeita o fuso horário local.
 */
export function formatFriendlyDate(isoString: string | undefined | null): string {
  if (!isoString) return 'Sem data';

  try {
    const cleanStr = isoString.trim();

    // 1. Caso seja formato YYYY-MM-DD puro
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      return formatDateOnlyBr(cleanStr);
    }

    // 2. Caso seja uma data com hora zerada (meia-noite UTC/GMT ou timezone-unspecified)
    // Exemplos: 2026-06-18T00:00:00.000Z, 2026-06-18T00:00:00+00:00, 2026-06-18 00:00:00
    const isMidnight = cleanStr.includes('T00:00:00') ||
                       cleanStr.includes(' 00:00:00') ||
                       /T00:00:00(\.000)?(Z|\+00:00)?$/.test(cleanStr);

    if (isMidnight) {
      return formatDateOnlyBr(cleanStr);
    }

    // 3. Caso contrário, é um timestamp real (como completed_at ou created_at)
    const date = new Date(cleanStr);
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return 'Data inválida';
  }
}
