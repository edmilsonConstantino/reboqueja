"use client";

import { BarraNavegacaoApp } from "@/components/BottomSheet";

export default function LayoutCondutor({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <BarraNavegacaoApp papel="CONDUTOR" />
      {children}
    </div>
  );
}
