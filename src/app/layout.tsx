import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ProvedorTema } from "@/components/ProvedorTema";

export const metadata: Metadata = {
  title: "ReboqueJá — Reboque na Cidade da Matola",
  description:
    "Liga condutores com veículo avariado ou acidentado a empresas de reboque na Cidade da Matola, Moçambique. Protótipo académico.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFC300",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-MZ" suppressHydrationWarning>
      <body>
        <ProvedorTema>{children}</ProvedorTema>
      </body>
    </html>
  );
}
