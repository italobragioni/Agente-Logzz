import { cn, formatTime } from "@/lib/utils";
import type { Message } from "@/lib/types";

export function MessageBubble({ message }: { message: Message }) {
  const isCustomer = message.role === "customer";
  const isHuman = message.role === "human";

  return (
    <div className={cn("flex", isCustomer ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
          isCustomer && "rounded-bl-sm bg-white text-gray-800",
          !isCustomer && !isHuman && "rounded-br-sm bg-brand-600 text-white",
          isHuman && "rounded-br-sm bg-indigo-600 text-white"
        )}
      >
        {!isCustomer && (
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-80">
            {isHuman ? "Você (atendente)" : "Agente"}
          </p>
        )}

        {message.type === "image" ? (
          <p className="italic opacity-90">📷 Imagem recebida</p>
        ) : message.type === "audio" ? (
          <p className="italic opacity-90">🎤 Áudio recebido</p>
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}

        <p
          className={cn(
            "mt-1 text-right text-[10px]",
            isCustomer ? "text-gray-400" : "text-white/70"
          )}
        >
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
