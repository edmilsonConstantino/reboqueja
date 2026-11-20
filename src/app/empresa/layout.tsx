"use client";

import { BarraNavegacaoApp } from "@/components/BottomSheet";

export default function LayoutEmpresa({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-[calc(4.5rem_+_env(safe-area-inset-bottom))] md:pb-0">
      <BarraNavegacaoApp papel="EMPRESA" />
      {children}
    </div>
  );
}
