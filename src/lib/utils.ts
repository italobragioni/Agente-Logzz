// Utilidades gerais

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(
  value: number | string | null | undefined
): string {
  // Colunas numeric do Postgres podem vir como string; coagimos com segurança.
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  return safe.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  try {
    return new Date(value).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// Remove tudo que não é dígito (útil para telefone/CEP)
export function onlyDigits(value: string): string {
  return (value || "").replace(/\D/g, "");
}

// Loga no servidor sem nunca expor tokens/segredos
export function safeLog(label: string, data?: unknown) {
  try {
    if (data === undefined) {
      console.log(`[WhatsAgent] ${label}`);
    } else {
      console.log(`[WhatsAgent] ${label}`, data);
    }
  } catch {
    // ignora erros de log
  }
}
