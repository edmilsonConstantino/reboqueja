"use client";

import { BarraNavegacaoApp } from "@/components/BottomSheet";

export default function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <BarraNavegacaoApp papel="ADMIN" />
      {children}
    </div>
  );
}
