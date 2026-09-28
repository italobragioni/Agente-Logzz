"use client";

import { useState, useTransition } from "react";
import {
  addObjectionAction,
  updateObjectionAction,
  deleteObjectionAction,
} from "@/app/(app)/treinamento/actions";
import { useToast } from "@/components/ui/Toast";
import type { Objection } from "@/lib/types";

function ObjectionRow({ item }: { item: Objection }) {
  const [objection, setObjection] = useState(item.objection);
  const [answer, setAnswer] = useState(item.answer);
  const [pending, startTransition] = useTransition();
  const { success, error } = useToast();

  function save() {
    startTransition(async () => {
      const res = await updateObjectionAction(item.id, { objection, answer });
      if (res?.error) error(res.error);
      else success("Objeção salva.");
    });
  }
  function remove() {
    if (!confirm("Excluir esta objeção?")) return;
    startTransition(async () => {
      const res = await deleteObjectionAction(item.id);
      if (res?.error) error(res.error);
      else success("Excluída.");
    });
  }

  return (
    <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
      <input
        className="input"
        placeholder="Objeção (ex: Tenho medo de pagar e não receber)"
        value={objection}
        onChange={(e) => setObjection(e.target.value)}
      />
      <textarea
        className="input resize-y"
        rows={2}
        placeholder="Resposta recomendada"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <button onClick={remove} disabled={pending} className="btn-secondary">
          🗑
        </button>
        <button onClick={save} disabled={pending} className="btn-primary">
          Salvar
        </button>
      </div>
    </div>
  );
}

export function ObjectionManager({ objections }: { objections: Objection[] }) {
  const [pending, startTransition] = useTransition();
  const { error } = useToast();

  function add() {
    startTransition(async () => {
      const res = await addObjectionAction();
      if (res?.error) error(res.error);
    });
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Objeções dos clientes
          </h2>
          <p className="text-sm text-gray-500">
            Nunca crie falsas urgências, estoque, descontos ou promoções.
          </p>
        </div>
        <button onClick={add} disabled={pending} className="btn-secondary">
          + Adicionar
        </button>
      </div>

      {objections.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
          Nenhuma objeção cadastrada.
        </p>
      ) : (
        <div className="space-y-3">
          {objections.map((o) => (
            <ObjectionRow key={o.id} item={o} />
          ))}
        </div>
      )}
    </div>
  );
}
