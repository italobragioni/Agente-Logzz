import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";

const STYLES: Record<OrderStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  awaiting_confirmation: "bg-amber-100 text-amber-700",
  confirmed: "bg-brand-100 text-brand-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  out_for_delivery: "bg-purple-100 text-purple-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  failed_delivery: "bg-orange-100 text-orange-700",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const label = ORDER_STATUS_LABELS[status] || status;
  const style = STYLES[status] || "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}
