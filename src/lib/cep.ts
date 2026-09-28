import { onlyDigits, safeLog } from "./utils";

export interface CepResult {
  found: boolean;
  postal_code: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

// Consulta um CEP usando a API pública ViaCEP.
// Nunca lança exceção: em caso de erro retorna { found: false }.
export async function lookupCep(rawCep: string): Promise<CepResult> {
  const cep = onlyDigits(rawCep);

  if (cep.length !== 8) {
    return { found: false, postal_code: cep };
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      // Sem cache para sempre pegar dado atual
      cache: "no-store",
    });

    if (!res.ok) {
      safeLog("CEP: resposta não OK", res.status);
      return { found: false, postal_code: cep };
    }

    const data = await res.json();

    if (data.erro) {
      return { found: false, postal_code: cep };
    }

    return {
      found: true,
      postal_code: cep,
      street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
    };
  } catch (err) {
    safeLog("CEP: erro na consulta", (err as Error)?.message);
    return { found: false, postal_code: cep };
  }
}
