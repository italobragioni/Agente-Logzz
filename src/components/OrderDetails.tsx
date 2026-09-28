"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { useToast } from "@/components/ui/Toast";
import { updateOrderStatusAction } from "@/app/(app)/pedidos/actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_ORDER,
  type Order,
  type OrderStatus,
} from "@/lib/types";

interface OrderItemRow {
  id: string;
  product_name: string;
  offer_label: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface HistoryRow {
  id: string;
  status: OrderStatus;
  note: string;
  created_at: string;
}

function Info({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-gray-800">{value || "—"}</p>
    </div>
  );
}

export function OrderDetails({
  order,
  items,
  history,
  conversationId,
}: {
  order: Order;
  items: OrderItemRow[];
  history: HistoryRow[];
  conversationId: string | null;
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [pending, startTransition] = useTransition();

  function saveStatus() {
    startTransition(async () => {
      const res = await updateOrderStatusAction(order.id, status);
      if (res?.error) error(res.error);
      else {
        success("Status atualizado!");
        router.refresh();
      }
    });
  }

  const address = [
    order.street && `${order.street}, ${order.number || "s/n"}`,
    order.complement,
    order.neighborhood,
    order.city && `${order.city}${order.state ? "/" + order.state : ""}`,
    order.postal_code && `CEP ${order.postal_code}`,
  ]
    .filter(Boolean)
    .join(" — ");

  return (
    <div className="space-y-6">
      {/* Cabeçalho / status */}
      <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">
              Pedido #{order.order_number}
            </h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-gray-400">
            Criado em {formatDate(order.created_at)}
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="label">Alterar status</label>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
            >
              {ORDER_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={saveStatus}
            disabled={pending || status === order.status}
            className="btn-primary"
          >
            Salvar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cliente */}
        <div className="card p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Cliente
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Info label="Nome" value={order.customer_name} />
            <Info label="Telefone" value={order.customer_phone} />
          </div>
          <div className="mt-4">
            <Info label="Endereço" value={address} />
          </div>
          {order.reference && (
            <div className="mt-4">
              <Info label="Ponto de referência" value={order.reference} />
            </div>
          )}
        </div>

        {/* Pagamento */}
        <div className="card p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Pagamento
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Info label="Forma de pagamento" value={order.payment_method} />
            <Info
              label="Tipo"
              value={
                order.payment_type === "cash_on_delivery"
                  ? "Na entrega (COD)"
                  : order.payment_type
              }
            />
            <Info label="Subtotal" value={formatCurrency(order.subtotal)} />
            <Info label="Frete" value={formatCurrency(order.shipping_price)} />
          </div>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Total
            </p>
            <p className="mt-0.5 text-2xl font-bold text-brand-600">
              {formatCurrency(order.total)}
            </p>
          </div>
        </div>
      </div>

      {/* Itens */}
      <div className="card p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Itens do pedido
        </h3>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">Sem itens.</p>
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {it.product_name || "Produto"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {it.offer_label || `${it.quantity} unidade(s)`} ·{" "}
                    {it.quantity} x {formatCurrency(it.unit_price)}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(it.total_price)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Observações + conversa */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Observações
          </h3>
          <p className="text-sm text-gray-700">
            {order.notes || "Sem observações."}
          </p>
          {conversationId && (
            <Link
              href={`/conversas?c=${conversationId}`}
              className="btn-secondary mt-4 text-xs"
            >
              Ver conversa associada
            </Link>
          )}
        </div>

        {/* Histórico */}
        <div className="card p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Histórico
          </h3>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400">Sem histórico.</p>
          ) : (
            <ol className="space-y-3">
              {history.map((h) => (
                <li key={h.id} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-brand-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {ORDER_STATUS_LABELS[h.status] || h.status}
                    </p>
                    {h.note && (
                      <p className="text-xs text-gray-500">{h.note}</p>
                    )}
                    <p className="text-[10px] text-gray-400">
                      {formatDate(h.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
