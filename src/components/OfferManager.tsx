"use client";

import { useState, useTransition } from "react";
import {
  addOfferAction,
  updateOfferAction,
  deleteOfferAction,
} from "@/app/(app)/produto/actions";
import { useToast } from "@/components/ui/Toast";
import type { ProductOffer } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

function OfferRow({ offer }: { offer: ProductOffer }) {
  const [label, setLabel] = useState(offer.label);
  const [quantity, setQuantity] = useState(String(offer.quantity));
  const [price, setPrice] = useState(String(offer.price));
  const [pending, startTransition] = useTransition();
  const { success, error } = useToast();

  function save() {
    startTransition(async () => {
      const res = await updateOfferAction(offer.id, {
        label,
        quantity: Number(quantity) || 1,
        price: Number(String(price).replace(",", ".")) || 0,
      });
      if (res?.error) error(res.error);
      else success("Oferta salva.");
    });
  }

  function remove() {
    if (!confirm("Excluir esta oferta?")) return;
    startTransition(async () => {
      const res = await deleteOfferAction(offer.id);
      if (res?.error) error(res.error);
      else success("Oferta excluída.");
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="label">Descrição</label>
        <input
          className="input"
          placeholder="Ex: 2 unidades"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>
      <div className="w-full sm:w-24">
        <label className="label">Qtd.</label>
        <input
          type="number"
          min={1}
          className="input"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>
      <div className="w-full sm:w-36">
        <label className="label">Preço (R$)</label>
        <input
          className="input"
          placeholder="199,00"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={pending} className="btn-primary">
          Salvar
        </button>
        <button onClick={remove} disabled={pending} className="btn-secondary">
          🗑
        </button>
      </div>
    </div>
  );
}

export function OfferManager({
  productId,
  offers,
}: {
  productId: string;
  offers: ProductOffer[];
}) {
  const [pending, startTransition] = useTransition();
  const { error } = useToast();

  function add() {
    startTransition(async () => {
      const res = await addOfferAction(productId);
      if (res?.error) error(res.error);
    });
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Ofertas</h2>
          <p className="text-sm text-gray-500">
            Ex: 1 unidade por R$149, 2 por R$199, 3 por R$249.
          </p>
        </div>
        <button onClick={add} disabled={pending} className="btn-secondary">
          + Adicionar
        </button>
      </div>

      {offers.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
          Nenhuma oferta cadastrada. Clique em “Adicionar”.
        </p>
      ) : (
        <div className="space-y-3">
          {offers.map((o) => (
            <div key={o.id}>
              <OfferRow offer={o} />
              {o.price > 0 && (
                <p className="mt-1 pl-1 text-xs text-gray-400">
                  {o.quantity} unidade(s) por {formatCurrency(o.price)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
