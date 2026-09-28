"use client";

import Link from "next/link";
import { cn, formatTime } from "@/lib/utils";

export interface ConversationListItem {
  id: string;
  name: string;
  phone: string;
  last_message: string;
  last_message_at: string | null;
  status: "bot" | "human";
}

export function ConversationList({
  items,
  selectedId,
}: {
  items: ConversationListItem[];
  selectedId?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-gray-400">
        Nenhuma conversa ainda. Quando um cliente enviar mensagem, ela aparece
        aqui.
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-gray-100 overflow-y-auto">
      {items.map((c) => (
        <Link
          key={c.id}
          href={`/conversas?c=${c.id}`}
          className={cn(
            "flex flex-col gap-0.5 px-4 py-3 transition-colors hover:bg-gray-50",
            selectedId === c.id && "bg-brand-50"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="truncate font-semibold text-gray-900">
              {c.name || c.phone}
            </span>
            <span className="ml-2 flex-shrink-0 text-[10px] text-gray-400">
              {formatTime(c.last_message_at)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs text-gray-500">
              {c.last_message || "—"}
            </span>
            <span
              className={cn(
                "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                c.status === "human"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-brand-100 text-brand-700"
              )}
            >
              {c.status === "human" ? "Humano" : "Agente"}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
