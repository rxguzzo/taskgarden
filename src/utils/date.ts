export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

/**
 * Obtém a data de "hoje" no formato YYYY-MM-DD.
 *
 * - Com `timeZone` (IANA, ex.: 'America/Sao_Paulo'): calcula o dia nesse fuso.
 *   Use SEMPRE no servidor, que na Vercel roda em UTC — sem isso, depois das
 *   21h no Brasil o servidor já estaria no dia seguinte.
 * - Sem `timeZone`: usa o fuso do ambiente (no navegador, o fuso do usuário).
 */
export function getTodayDateOnly(timeZone?: string): string {
  const now = new Date();

  if (timeZone) {
    try {
      // 'en-CA' formata como YYYY-MM-DD
      return new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now);
    } catch {
      // Fuso inválido: cai no cálculo local abaixo
    }
  }

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Extrai a parte da data YYYY-MM-DD de uma string/timestamp
 * de forma a evitar bugs de deslocamento de fuso horário.
 */
export function toDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? match[0] : null;
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

export function getIsoWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  // Ajusta para a quinta-feira da mesma semana (semana ISO começa na segunda)
  // getDay() retorna 0 para Domingo, mudamos Domingo para 7
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);

  const year = d.getFullYear();
  // Primeiro dia do ano ISO
  const firstDayOfYear = new Date(year, 0, 1);
  const firstDayOfWeek = firstDayOfYear.getDay() || 7;

  // Se o dia 1 de Jan for sex/sáb/dom, a semana 1 começa na próxima segunda-feira.
  // Caso contrário, a semana 1 começa na segunda anterior.
  let startOffset = 0;
  if (firstDayOfWeek > 4) {
    // Começa na segunda seguinte
    startOffset = (8 - firstDayOfWeek) * 24 * 60 * 60 * 1000;
  } else {
    // Começa na segunda anterior
    startOffset = (1 - firstDayOfWeek) * 24 * 60 * 60 * 1000;
  }

  const weekStart = firstDayOfYear.getTime() + startOffset;
  const diff = d.getTime() - weekStart;

  let weekNumber = 1;
  if (diff >= 0) {
    weekNumber = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  } else {
    // Se caiu antes da semana 1 do ano atual, pertence à última semana do ano anterior
    // Repetimos o cálculo para o ano anterior
    return getIsoWeekKey(`${year - 1}-12-28`);
  }

  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}
