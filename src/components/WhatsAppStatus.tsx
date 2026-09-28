"use client";

import { useState, useTransition } from "react";
import { saveWhatsappAction } from "@/app/(app)/whatsapp/actions";
import { useToast } from "@/components/ui/Toast";
import type { WhatsappSettings } from "@/lib/types";

export function WhatsAppStatus({
  settings,
  webhookUrl,
  connected,
  hasEnvToken,
}: {
  settings: WhatsappSettings;
  webhookUrl: string;
  connected: boolean;
  hasEnvToken: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const { success, error } = useToast();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await saveWhatsappAction(formData);
      if (res?.error) error(res.error);
      else success("Configurações do WhatsApp salvas!");
    });
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text).then(
      () => success("Copiado!"),
      () => error("Não foi possível copiar.")
    );
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="card flex items-center justify-between p-6">
        <div>
          <p className="text-sm font-medium text-gray-500">
            Status da conexão
          </p>
          <p
            className={`mt-1 text-xl font-bold ${
              connected ? "text-brand-600" : "text-gray-400"
            }`}
          >
            {connected ? "CONECTADO" : "DESCONECTADO"}
          </p>
        </div>
        <span
          className={`h-3 w-3 rounded-full ${
            connected ? "bg-brand-500" : "bg-gray-300"
          }`}
        />
      </div>

      {/* Webhook */}
      <div className="card p-6">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">
          Webhook (para configurar na Meta)
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Cole esta URL no painel da Meta como “Callback URL”.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input readOnly className="input font-mono text-xs" value={webhookUrl} />
          <button
            type="button"
            onClick={() => copy(webhookUrl)}
            className="btn-secondary"
          >
            Copiar
          </button>
        </div>
      </div>

      {/* Formulário de credenciais */}
      <form action={onSubmit} className="card space-y-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Credenciais do WhatsApp Cloud API
        </h2>

        <div>
          <label className="label">Phone Number ID</label>
          <input
            name="phone_number_id"
            className="input"
            placeholder="Ex: 123456789012345"
            defaultValue={settings.phone_number_id}
          />
          <p className="field-hint">
            Encontrado no painel da Meta em WhatsApp &gt; API Setup. É o que
            identifica seu número no sistema.
          </p>
        </div>

        <div>
          <label className="label">WhatsApp Business Account ID</label>
          <input
            name="business_account_id"
            className="input"
            placeholder="Ex: 987654321098765"
            defaultValue={settings.business_account_id}
          />
        </div>

        <div>
          <label className="label">Número exibido (opcional)</label>
          <input
            name="display_phone_number"
            className="input"
            placeholder="Ex: +55 31 99999-9999"
            defaultValue={settings.display_phone_number}
          />
        </div>

        <div>
          <label className="label">Verify Token</label>
          <input
            name="verify_token"
            className="input"
            placeholder="Um texto secreto que você inventa"
            defaultValue={settings.verify_token}
          />
          <p className="field-hint">
            Use o MESMO valor que está na variável de ambiente
            META_WHATSAPP_VERIFY_TOKEN e cole também no painel da Meta.
          </p>
        </div>

        <div>
          <label className="label">Access Token (opcional)</label>
          <input
            name="access_token"
            type="password"
            className="input"
            placeholder={
              hasEnvToken
                ? "Já configurado por variável de ambiente — deixe em branco para manter"
                : "Cole o token de acesso da Meta"
            }
          />
          <p className="field-hint">
            {hasEnvToken
              ? "Recomendado: deixe em branco e use a variável de ambiente (mais seguro)."
              : "Se preferir, configure via variável de ambiente META_WHATSAPP_ACCESS_TOKEN."}
          </p>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "Salvando..." : "Salvar e conectar"}
          </button>
        </div>
      </form>
    </div>
  );
}
