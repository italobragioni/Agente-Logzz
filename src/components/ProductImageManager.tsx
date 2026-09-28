"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  addProductImageAction,
  deleteProductImageAction,
} from "@/app/(app)/produto/actions";
import { useToast } from "@/components/ui/Toast";
import type { ProductImage } from "@/lib/types";

export function ProductImageManager({
  productId,
  userId,
  images,
}: {
  productId: string;
  userId: string;
  images: ProductImage[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const { success, error } = useToast();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = createClient();

    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${userId}/${productId}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("product-images")
          .upload(path, file, { upsert: false });

        if (upErr) {
          error(`Erro ao enviar imagem: ${upErr.message}`);
          continue;
        }

        const { data: pub } = supabase.storage
          .from("product-images")
          .getPublicUrl(path);

        const res = await addProductImageAction(
          productId,
          path,
          pub.publicUrl
        );
        if (res?.error) error(res.error);
      }
      success("Imagens enviadas!");
    } catch {
      error("Falha inesperada ao enviar imagem.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(img: ProductImage) {
    if (!confirm("Excluir esta imagem?")) return;
    startTransition(async () => {
      const res = await deleteProductImageAction(img.id, img.storage_path);
      if (res?.error) error(res.error);
      else success("Imagem excluída.");
    });
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Imagens do produto
          </h2>
          <p className="text-sm text-gray-500">
            O agente pode enviar essas imagens quando o cliente pedir para ver.
          </p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-secondary"
        >
          {uploading ? "Enviando..." : "+ Adicionar"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {images.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
          Nenhuma imagem ainda.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-gray-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.public_url}
                alt="Imagem do produto"
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => remove(img)}
                disabled={pending}
                className="absolute right-1.5 top-1.5 rounded-lg bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
