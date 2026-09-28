"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/auth-actions";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/produto", label: "Produto", icon: "📦" },
  { href: "/treinamento", label: "Treinamento", icon: "🎓" },
  { href: "/whatsapp", label: "WhatsApp", icon: "💬" },
  { href: "/conversas", label: "Conversas", icon: "🗨️" },
  { href: "/pedidos", label: "Pedidos", icon: "🧾" },
  { href: "/configuracoes", label: "Configurações", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavLinks = (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand-50 text-brand-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Botão mobile */}
      <button
        onClick={() => setOpen(true)}
        className="btn-secondary fixed left-4 top-4 z-30 lg:hidden"
        aria-label="Abrir menu"
      >
        ☰
      </button>

      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-100 bg-white px-4 py-6 transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
            W
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-gray-900">
              WhatsAgent
            </p>
            <p className="text-xs leading-tight text-gray-400">COD</p>
          </div>
        </div>

        {NavLinks}

        <form action={signOutAction} className="mt-auto pt-4">
          <button type="submit" className="btn-ghost w-full justify-start">
            <span>🚪</span> Sair
          </button>
        </form>
      </aside>
    </>
  );
}
