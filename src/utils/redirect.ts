/**
 * Utilitário de segurança para validar caminhos de redirecionamento internos.
 * Impede ataques de Open Redirect rejeitando caminhos malformados,
 * URLs externas, barras invertidas e protocolos.
 */
export function getSafeRedirectUrl(url: string | null | undefined, fallback: string = '/garden'): string {
  if (!url) {
    return fallback;
  }

  // 1. Decodificar recursivamente para evitar double URL encoding bypass
  let decoded = url;
  try {
    let prev = '';
    let count = 0;
    while (decoded !== prev && count < 3) {
      prev = decoded;
      decoded = decodeURIComponent(decoded);
      count++;
    }
  } catch {
    return fallback;
  }

  // Trim espaços
  decoded = decoded.trim();

  // 2. Rejeitar se contiver barra invertida (\) - comum para bypass em navegadores baseados no Chromium
  if (decoded.includes('\\')) {
    return fallback;
  }

  // 3. Rejeitar se contiver barras duplas (//) ou múltiplas barras iniciais (ex: ///site.com)
  if (decoded.includes('//') || /^\/{2,}/.test(decoded)) {
    return fallback;
  }

  // 4. Rejeitar se contiver qualquer protocolo (ex: http:, https:, javascript:, data:)
  // O padrão regex verifica a presença de ":" após letras/números ou no início.
  if (/^[a-zA-Z0-9.+-]+:/.test(decoded)) {
    return fallback;
  }

  // 5. Garantir que começa com uma barra única '/' e não termine sendo vazio ou malformado
  if (!decoded.startsWith('/')) {
    return fallback;
  }

  // 6. Teste de segurança contra open redirect usando URL parsing
  try {
    // Ao fazer o parse com base num domínio mockado, qualquer tentativa de bypass absolute url
    // mudará o host. Se o host mudar, a URL não é segura.
    const mockBase = 'http://safe-internal-redirect.local';
    const parsed = new URL(decoded, mockBase);
    if (parsed.origin !== mockBase) {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return decoded;
}
