import type { Product } from "./types";

// Normaliza texto para comparação (minúsculas, sem acentos, sem espaços extra)
function normalize(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

// Transforma um texto com itens separados por vírgula/quebra de linha em lista
function toList(text: string): string[] {
  return (text || "")
    .split(/[,;\n]/)
    .map((s) => normalize(s))
    .filter(Boolean);
}

export interface RegionCheck {
  covered: boolean;
  reason: string;
}

// Verifica se uma cidade/estado é atendida com base no cadastro do produto.
// Regra de segurança: se o lojista NÃO cadastrou nenhuma região, assumimos
// que não há restrição (atende) — mas o agente é orientado a nunca inventar.
// Se cadastrou estados/cidades, exigimos correspondência.
export function checkRegion(
  product: Pick<Product, "states" | "cities" | "regions">,
  city?: string,
  state?: string
): RegionCheck {
  const states = toList(product.states);
  const cities = toList(product.cities);
  const regions = toList(product.regions);

  const hasAnyRestriction =
    states.length > 0 || cities.length > 0 || regions.length > 0;

  // Sem nenhuma restrição cadastrada: não bloqueia (lojista não configurou).
  if (!hasAnyRestriction) {
    return {
      covered: true,
      reason: "Nenhuma restrição de região cadastrada.",
    };
  }

  const nCity = normalize(city || "");
  const nState = normalize(state || "");

  // Se ainda não temos cidade/estado, não dá para validar
  if (!nCity && !nState) {
    return {
      covered: false,
      reason: "Sem cidade/estado para validar.",
    };
  }

  const cityMatch = nCity
    ? cities.includes(nCity) || regions.some((r) => r.includes(nCity))
    : false;

  const stateMatch = nState
    ? states.includes(nState) ||
      states.some((s) => s === nState) ||
      regions.some((r) => r.includes(nState))
    : false;

  // Se há lista de cidades, a cidade precisa bater.
  if (cities.length > 0) {
    if (cityMatch) return { covered: true, reason: "Cidade atendida." };
    // Se não bate cidade mas o estado está listado e não há cidade específica exigida
    if (states.length > 0 && stateMatch)
      return { covered: true, reason: "Estado atendido." };
    return { covered: false, reason: "Cidade não atendida." };
  }

  // Sem lista de cidades, valida por estado/região
  if (states.length > 0) {
    if (stateMatch) return { covered: true, reason: "Estado atendido." };
    return { covered: false, reason: "Estado não atendido." };
  }

  // Só há "regions" (texto livre) — tenta casar cidade ou estado
  if (cityMatch || stateMatch) {
    return { covered: true, reason: "Região atendida." };
  }

  return { covered: false, reason: "Região não atendida." };
}
