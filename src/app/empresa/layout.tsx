"use client";

import { BarraNavegacaoApp } from "@/components/BottomSheet";

export default function LayoutEmpresa({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <BarraNavegacaoApp papel="EMPRESA" />
      {children}
    </div>
  );
}
