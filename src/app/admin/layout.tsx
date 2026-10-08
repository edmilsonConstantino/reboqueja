"use client";

import { BarraLateralAdmin, BarraTopoAdmin } from "@/components/AdminSidebar";

export default function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Secção admin vive sempre em tema escuro, coerente com a sidebar do mock
    <div className="min-h-screen flex bg-neutral-950 text-neutral-100 dark">
      {/* Sidebar fixa (desktop) */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        <BarraLateralAdmin />
      </aside>

      {/* Barra horizontal (mobile/tablet) */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40">
        <BarraLateralAdmin variante="topo" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col pt-14 lg:pt-0">
        <div className="hidden lg:block">
          <BarraTopoAdmin />
        </div>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
