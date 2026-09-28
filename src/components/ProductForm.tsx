"use client";

import { useTransition } from "react";
import { saveProductAction } from "@/app/(app)/produto/actions";
import { useToast } from "@/components/ui/Toast";
import type { Product } from "@/lib/types";

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  hint,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  hint?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className="input"
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
      />
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  placeholder,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        className="input resize-y"
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
      />
    </div>
  );
}

export function ProductForm({ product }: { product: Product }) {
  const [pending, startTransition] = useTransition();
  const { success, error } = useToast();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await saveProductAction(product.id, formData);
      if (res?.error) error(res.error);
      else success("Produto salvo com sucesso!");
    });
  }

  return (
    <form action={onSubmit} className="space-y-6">
      {/* Dados principais */}
      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Dados do produto
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <Field
            label="Nome do produto"
            name="name"
            defaultValue={product.name}
            placeholder="Ex: Kit Skincare Premium"
          />
          <TextArea
            label="Descrição completa"
            name="description"
            defaultValue={product.description}
            rows={4}
            placeholder="Descreva o produto em detalhes"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Preço normal (R$)"
              name="regular_price"
              defaultValue={product.regular_price}
              placeholder="199,00"
            />
            <Field
              label="Preço promocional (R$)"
              name="promo_price"
              defaultValue={product.promo_price}
              placeholder="149,00"
            />
          </div>
          <Field
            label="Oferta atual (texto livre)"
            name="current_offer"
            defaultValue={product.current_offer}
            placeholder="Ex: Leve 2 e pague 1"
            hint="Ofertas com preço você cadastra abaixo, no bloco Ofertas."
          />
        </div>
      </div>

      {/* Conteúdo de vendas */}
      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Informações de venda
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <TextArea label="Benefícios" name="benefits" defaultValue={product.benefits} />
          <TextArea label="Características" name="features" defaultValue={product.features} />
          <TextArea label="Modo de uso" name="usage_instructions" defaultValue={product.usage_instructions} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextArea label="Para quem é indicado" name="target_audience" defaultValue={product.target_audience} />
            <TextArea label="Para quem NÃO é indicado" name="not_for" defaultValue={product.not_for} />
          </div>
          <TextArea label="Garantia" name="warranty" defaultValue={product.warranty} rows={2} />
          <TextArea label="Observações" name="notes" defaultValue={product.notes} rows={2} />
        </div>
      </div>

      {/* Entrega */}
      <div className="card p-6">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">
          Entrega e regiões
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          O agente NUNCA vai prometer entrega em regiões que não estiverem aqui.
        </p>
        <div className="grid grid-cols-1 gap-4">
          <Field
            label="Prazo estimado de entrega"
            name="delivery_estimate"
            defaultValue={product.delivery_estimate}
            placeholder="Ex: 3 a 7 dias úteis"
          />
          <TextArea
            label="Estados atendidos"
            name="states"
            defaultValue={product.states}
            rows={2}
            placeholder="Ex: SP, RJ, MG (separados por vírgula)"
          />
          <TextArea
            label="Cidades atendidas (se necessário)"
            name="cities"
            defaultValue={product.cities}
            rows={2}
            placeholder="Ex: Belo Horizonte, Contagem (separadas por vírgula)"
          />
          <TextArea
            label="Regiões atendidas (texto livre)"
            name="regions"
            defaultValue={product.regions}
            rows={2}
            placeholder="Ex: Grande BH, região metropolitana"
          />
        </div>
      </div>

      {/* Pagamento */}
      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Pagamento na entrega (COD)
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <Field
            label="Formas de pagamento aceitas na entrega"
            name="payment_methods"
            defaultValue={product.payment_methods}
            placeholder="Dinheiro, Pix, Cartão"
          />

          <label className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <input
              type="checkbox"
              name="cash_on_delivery"
              defaultChecked={product.cash_on_delivery}
              className="h-4 w-4 accent-brand-600"
            />
            <span className="text-sm text-gray-700">
              Pagamento na entrega? <strong>(recomendado: SIM)</strong>
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <input
              type="checkbox"
              name="requires_upfront_payment"
              defaultChecked={product.requires_upfront_payment}
              className="h-4 w-4 accent-brand-600"
            />
            <span className="text-sm text-gray-700">
              Pagamento antecipado obrigatório? <strong>(padrão: NÃO)</strong>
            </span>
          </label>

          <TextArea
            label="Mensagem padrão sobre pagamento"
            name="payment_message"
            defaultValue={product.payment_message}
            rows={2}
          />
        </div>
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary shadow-soft">
          {pending ? "Salvando..." : "Salvar produto"}
        </button>
      </div>
    </form>
  );
}
