"use client";

import { useRouter } from "next/navigation";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order } from "@/lib/types";

export function OrderList({ orders }: { orders: Order[] }) {
  const router = useRouter();

  if (orders.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-sm text-gray-400">
          Nenhum pedido ainda. Quando o agente fechar uma venda, ela aparece
          aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-medium">Nº</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Telefone</th>
              <th className="px-4 py-3 font-medium">Cidade/UF</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Pagamento</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((o) => (
              <tr
                key={o.id}
                onClick={() => router.push(`/pedidos/${o.id}`)}
                className="cursor-pointer transition-colors hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-semibold text-gray-900">
                  #{o.order_number}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {o.customer_name || "—"}
                </td>
                <td className="px-4 py-3 text-gray-500">{o.customer_phone}</td>
                <td className="px-4 py-3 text-gray-500">
                  {o.city}
                  {o.state ? `/${o.state}` : ""}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {formatCurrency(o.total)}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {o.payment_method || "Na entrega"}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {formatDate(o.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
