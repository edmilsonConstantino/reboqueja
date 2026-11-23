import type { Metadata } from "next";
import { BarraNavegacaoPublica, Rodape } from "@/components/ui";
import { ProvedorTema } from "@/components/ProvedorTema";

export const metadata: Metadata = {
  title: "ReboqueJá — Cidade da Matola",
};

export default function RootLayoutPublico({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1E120B] dark:bg-[#0C0603] dark:text-[#F5EDE4] transition-colors duration-200">
      <BarraNavegacaoPublica />
      <main className="flex-1">{children}</main>
      <Rodape />
    </div>
  );
}
