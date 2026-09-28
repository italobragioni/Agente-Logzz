"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageBubble } from "@/components/MessageBubble";
import { useToast } from "@/components/ui/Toast";
import {
  takeoverConversationAction,
  returnToBotAction,
  sendManualMessageAction,
} from "@/app/(app)/conversas/actions";
import type { Message } from "@/lib/types";

export function ChatWindow({
  conversationId,
  contactName,
  contactPhone,
  status,
  messages,
}: {
  conversationId: string;
  contactName: string;
  contactPhone: string;
  status: "bot" | "human";
  messages: Message[];
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Rola para o final ao carregar/atualizar
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages.length]);

  // Atualiza a conversa periodicamente (mensagens novas chegam pelo webhook)
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(interval);
  }, [router]);

  function takeover() {
    startTransition(async () => {
      const res = await takeoverConversationAction(conversationId);
      if (res?.error) error(res.error);
      else {
        success("Você assumiu a conversa. O agente parou de responder.");
        router.refresh();
      }
    });
  }

  function returnBot() {
    startTransition(async () => {
      const res = await returnToBotAction(conversationId);
      if (res?.error) error(res.error);
      else {
        success("Conversa devolvida ao agente.");
        router.refresh();
      }
    });
  }

  function send() {
    const value = text.trim();
    if (!value) return;
    startTransition(async () => {
      const res = await sendManualMessageAction(conversationId, value);
      if (res?.error) {
        error(res.error);
      } else {
        setText("");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <p className="font-semibold text-gray-900">
            {contactName || contactPhone}
          </p>
          <p className="text-xs text-gray-400">{contactPhone}</p>
        </div>
        {status === "human" ? (
          <button
            onClick={returnBot}
            disabled={pending}
            className="btn-secondary text-xs"
          >
            Devolver para o agente
          </button>
        ) : (
          <button
            onClick={takeover}
            disabled={pending}
            className="btn-primary text-xs"
          >
            Assumir conversa
          </button>
        )}
      </div>

      {/* Mensagens */}
      <div className="flex-1 space-y-2 overflow-y-auto bg-gray-50 p-4">
        {messages.length === 0 ? (
          <p className="pt-10 text-center text-sm text-gray-400">
            Nenhuma mensagem nesta conversa.
          </p>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Barra de envio */}
      <div className="border-t border-gray-100 p-3">
        {status === "bot" && (
          <p className="mb-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
            O agente está atendendo. Para responder manualmente, clique em
            “Assumir conversa”.
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={
              status === "human"
                ? "Escreva uma mensagem..."
                : "Assuma a conversa para enviar mensagens"
            }
            disabled={status !== "human" || pending}
            className="input max-h-32 resize-none"
          />
          <button
            onClick={send}
            disabled={status !== "human" || pending || !text.trim()}
            className="btn-primary"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
