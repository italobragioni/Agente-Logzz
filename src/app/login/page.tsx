"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { signInAction, type AuthState } from "@/lib/auth-actions";

const initial: AuthState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Entrando..." : "Entrar"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(signInAction, initial);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold text-white">
            W
          </div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsAgent COD</h1>
          <p className="mt-1 text-sm text-gray-500">
            Seu agente de vendas no WhatsApp
          </p>
        </div>

        <div className="card p-8">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Entrar</h2>

          <form action={formAction} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                placeholder="voce@email.com"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            {state.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {state.error}
              </p>
            )}

            <SubmitButton />
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Não tem uma conta?{" "}
            <Link
              href="/cadastro"
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
