import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { ProductForm } from "@/components/ProductForm";
import { OfferManager } from "@/components/OfferManager";
import { ProductImageManager } from "@/components/ProductImageManager";
import { ensureProduct } from "./actions";
import type { Product, ProductOffer, ProductImage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProdutoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  // Garante que exista um produto
  await ensureProduct();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!product) {
    return (
      <div>
        <Header title="Produto" />
        <div className="card p-6 text-sm text-gray-500">
          Não foi possível carregar o produto. Recarregue a página.
        </div>
      </div>
    );
  }

  const [{ data: offers }, { data: images }] = await Promise.all([
    supabase
      .from("product_offers")
      .select("*")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("product_images")
      .select("*")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <div>
      <Header
        title="Produto"
        subtitle="Cadastre tudo sobre o produto que o agente vai vender"
      />

      <div className="space-y-6">
        <ProductForm product={product as Product} />
        <OfferManager
          productId={product.id}
          offers={(offers as ProductOffer[]) || []}
        />
        <ProductImageManager
          productId={product.id}
          userId={userId}
          images={(images as ProductImage[]) || []}
        />
      </div>
    </div>
  );
}
