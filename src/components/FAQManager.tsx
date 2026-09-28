"use client";

import { useState, useTransition } from "react";
import {
  addFaqAction,
  updateFaqAction,
  deleteFaqAction,
} from "@/app/(app)/treinamento/actions";
import { useToast } from "@/components/ui/Toast";
import type { Faq } from "@/lib/types";

function FaqRow({ faq }: { faq: Faq }) {
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);
  const [pending, startTransition] = useTransition();
  const { success, error } = useToast();

  function save() {
    startTransition(async () => {
      const res = await updateFaqAction(faq.id, { question, answer });
      if (res?.error) error(res.error);
      else success("Pergunta salva.");
    });
  }
  function remove() {
    if (!confirm("Excluir esta pergunta?")) return;
    startTransition(async () => {
      const res = await deleteFaqAction(faq.id);
      if (res?.error) error(res.error);
      else success("Excluída.");
    });
  }

  return (
    <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
      <input
        className="input"
        placeholder="Pergunta (ex: Preciso pagar agora?)"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <textarea
        className="input resize-y"
        rows={2}
        placeholder="Resposta"
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

export function FAQManager({ faqs }: { faqs: Faq[] }) {
  const [pending, startTransition] = useTransition();
  const { error } = useToast();

  function add() {
    startTransition(async () => {
      const res = await addFaqAction();
      if (res?.error) error(res.error);
    });
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Perguntas frequentes
          </h2>
          <p className="text-sm text-gray-500">
            O agente usa estas respostas quando o cliente perguntar algo parecido.
          </p>
        </div>
        <button onClick={add} disabled={pending} className="btn-secondary">
          + Adicionar
        </button>
      </div>

      {faqs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
          Nenhuma pergunta cadastrada.
        </p>
      ) : (
        <div className="space-y-3">
          {faqs.map((f) => (
            <FaqRow key={f.id} faq={f} />
          ))}
        </div>
      )}
    </div>
  );
}
