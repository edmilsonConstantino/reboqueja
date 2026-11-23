"use client";

import { useEffect, useState } from "react";
import { BarraLateralAdmin, BarraTopoAdmin } from "@/components/AdminSidebar";

const CHAVE_SIDEBAR = "rj_admin_sidebar_recolhida";

export default function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const [recolhida, setRecolhida] = useState(false);

  useEffect(() => {
    try {
      setRecolhida(localStorage.getItem(CHAVE_SIDEBAR) === "1");
    } catch {
      // Ignora erro de armazenamento
    }
  }, []);

  const alternarRecolher = () => {
    setRecolhida((anterior) => {
      const proximo = !anterior;
      try {
        localStorage.setItem(CHAVE_SIDEBAR, proximo ? "1" : "0");
      } catch {
        // Ignora erro de armazenamento
      }
      return proximo;
    });
  };

  return (
    // O painel segue o tema escolhido (claro/escuro) a partir de /admin/definicoes.
    <div className="min-h-screen flex bg-slate-100/80 dark:bg-[#070B14] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar fixa (desktop) — acompanha o tema claro/escuro */}
      <aside
        className={`hidden lg:block shrink-0 sticky top-0 h-screen transition-all duration-200 ${
          recolhida ? "w-20" : "w-64"
        }`}
      >
        <BarraLateralAdmin
          recolhida={recolhida}
          aoAlternarRecolher={alternarRecolher}
        />
      </aside>

      {/* Barra horizontal (mobile/tablet) */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40">
        <BarraLateralAdmin variante="topo" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col pt-[calc(3.5rem_+_env(safe-area-inset-top))] lg:pt-0">
        <div className="hidden lg:block">
          <BarraTopoAdmin />
        </div>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
