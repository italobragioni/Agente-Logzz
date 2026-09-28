"use client";

import { useTransition } from "react";
import { saveProfileAction } from "@/app/(app)/configuracoes/actions";
import { useToast } from "@/components/ui/Toast";

export function ProfileForm({
  fullName,
  businessName,
  email,
}: {
  fullName: string;
  businessName: string;
  email: string;
}) {
  const [pending, startTransition] = useTransition();
  const { success, error } = useToast();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await saveProfileAction(formData);
      if (res?.error) error(res.error);
      else success("Perfil salvo!");
    });
  }

  return (
    <form action={onSubmit} className="card space-y-4 p-6">
      <h2 className="text-lg font-semibold text-gray-900">Seus dados</h2>

      <div>
        <label className="label">E-mail</label>
        <input className="input bg-gray-50" value={email} readOnly disabled />
        <p className="field-hint">O e-mail de login não pode ser alterado aqui.</p>
      </div>

      <div>
        <label className="label" htmlFor="full_name">
          Seu nome
        </label>
        <input
          id="full_name"
          name="full_name"
          className="input"
          defaultValue={fullName}
          placeholder="Seu nome completo"
        />
      </div>

      <div>
        <label className="label" htmlFor="business_name">
          Nome do seu negócio
        </label>
        <input
          id="business_name"
          name="business_name"
          className="input"
          defaultValue={businessName}
          placeholder="Ex: Loja da Ana"
        />
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
