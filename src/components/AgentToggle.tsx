"use client";

import { useState, useTransition } from "react";
import { toggleAgentAction } from "@/app/(app)/dashboard/actions";
import { useToast } from "@/components/ui/Toast";

export function AgentToggle({ active }: { active: boolean }) {
  const [isActive, setIsActive] = useState(active);
  const [pending, startTransition] = useTransition();
  const { success, error } = useToast();

  function handleToggle() {
    const next = !isActive;
    startTransition(async () => {
      const res = await toggleAgentAction(next);
      if (res?.error) {
        error(res.error);
      } else {
        setIsActive(next);
        success(next ? "Agente ativado!" : "Agente desativado.");
      }
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      className={
        isActive
          ? "btn-secondary"
          : "btn-primary"
      }
    >
      {pending
        ? "Salvando..."
        : isActive
          ? "Desativar agente"
          : "Ativar agente"}
    </button>
  );
}
