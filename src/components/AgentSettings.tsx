"use client";

import { useState, useTransition } from "react";
import { saveAgentSettingsAction } from "@/app/(app)/treinamento/actions";
import { useToast } from "@/components/ui/Toast";
import type { AgentSettings as AgentSettingsType } from "@/lib/types";

const TONES = [
  "Natural",
  "Amigável",
  "Profissional",
  "Descontraído",
  "Vendedor",
  "Consultivo",
  "Personalizado",
];

const LENGTHS = ["Curtas", "Médias", "Detalhadas"];

export function AgentSettings({ settings }: { settings: AgentSettingsType }) {
  const [tone, setTone] = useState(settings.tone || "Amigável");
  const [pending, startTransition] = useTransition();
  const { success, error } = useToast();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await saveAgentSettingsAction(formData);
      if (res?.error) error(res.error);
      else success("Configurações do agente salvas!");
    });
  }

  return (
    <form action={onSubmit} className="space-y-6">
      {/* Personalidade */}
      <div className="card p-6">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">
          Personalidade e instruções
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Explique como o agente deve se comportar. Este é o coração do agente.
        </p>
        <textarea
          name="personality"
          rows={14}
          className="input resize-y font-mono text-xs leading-relaxed"
          defaultValue={settings.personality}
        />
      </div>

      {/* Tom e tamanho */}
      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Tom de voz e tamanho das respostas
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Tom de voz</label>
            <select
              name="tone"
              className="input"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tamanho das respostas</label>
            <select
              name="response_length"
              className="input"
              defaultValue={settings.response_length || "Curtas"}
            >
              {LENGTHS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <p className="field-hint">
              Recomendado: Curtas (a conversa é pelo WhatsApp).
            </p>
          </div>
        </div>

        {tone === "Personalizado" && (
          <div className="mt-4">
            <label className="label">Tom personalizado</label>
            <input
              name="custom_tone"
              className="input"
              placeholder="Descreva o tom desejado"
              defaultValue={settings.custom_tone}
            />
          </div>
        )}
      </div>

      {/* Regras de fechamento */}
      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Regras de fechamento
        </h2>
        <textarea
          name="closing_rules"
          rows={4}
          className="input resize-y"
          placeholder="Ex: Sempre confirmar o resumo do pedido antes de fechar."
          defaultValue={settings.closing_rules}
        />
        <div className="mt-4">
          <label className="label">Instruções adicionais (opcional)</label>
          <textarea
            name="extra_instructions"
            rows={3}
            className="input resize-y"
            placeholder="Qualquer instrução extra para o agente."
            defaultValue={settings.extra_instructions}
          />
        </div>
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary shadow-soft">
          {pending ? "Salvando..." : "Salvar treinamento"}
        </button>
      </div>
    </form>
  );
}
