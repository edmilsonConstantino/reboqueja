"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { usarTema } from "./ProvedorTema";

export function BottomSheetArrastavel({
  children,
  alturaColapsada = 180,
  alturaExpandidaPct = 0.62,
  className = "",
}: {
  children: React.ReactNode;
  alturaColapsada?: number;
  alturaExpandidaPct?: number;
  className?: string;
}) {
  const [altura, setAltura] = useState(alturaColapsada);
  const [expandidaMax, setExpandidaMax] = useState(600);
  const arrastando = useRef(false);
  const inicioY = useRef(0);
  const inicioAltura = useRef(0);

  useEffect(() => {
    const actualizar = () => {
      setExpandidaMax(Math.round(window.innerHeight * alturaExpandidaPct));
    };
    actualizar();
    window.addEventListener("resize", actualizar);
    return () => window.removeEventListener("resize", actualizar);
  }, [alturaExpandidaPct]);

  const iniciar = (y: number) => {
    arrastando.current = true;
    inicioY.current = y;
    inicioAltura.current = altura;
  };
  const mover = (y: number) => {
    if (!arrastando.current) return;
    const delta = inicioY.current - y;
    setAltura(
      Math.min(expandidaMax, Math.max(72, inicioAltura.current + delta))
    );
  };
  const soltar = () => {
    if (!arrastando.current) return;
    arrastando.current = false;
    // Ajusta ao estado mais próximo
    setAltura((a) => {
      if (a > expandidaMax * 0.6) return expandidaMax;
      if (a > alturaColapsada * 1.4) return Math.min(expandidaMax, alturaColapsada + 160);
      return alturaColapsada;
    });
  };

  return (
    <div
      className={`fixed left-0 right-0 bottom-0 z-30 bg-white dark:bg-neutral-900 rounded-t-3xl shadow-sheet rj-sheet-up ${className}`}
      style={{ height: altura }}
    >
      {/* Pega */}
      <div
        className="h-9 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        onTouchStart={(e) => iniciar(e.touches[0].clientY)}
        onTouchMove={(e) => mover(e.touches[0].clientY)}
        onTouchEnd={soltar}
        onMouseDown={(e) => iniciar(e.clientY)}
        onMouseMove={(e) => arrastando.current && mover(e.clientY)}
        onMouseUp={soltar}
        onMouseLeave={soltar}
        onDoubleClick={() =>
          setAltura(altura > alturaColapsada ? alturaColapsada : expandidaMax)
        }
      >
        <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
      </div>
      <div
        className="overflow-y-auto px-4 pb-6 no-scrollbar"
        style={{ height: altura - 36 }}
      >
        {children}
      </div>
    </div>
  );
}

export function BarraNavegacaoApp({
  papel,
}: {
  papel: "CONDUTOR" | "EMPRESA" | "ADMIN";
}) {
  const { tema, alternar } = usarTema();
  const pathname = usePathname();

  const itens = {
    CONDUTOR: [
      { href: "/app", rotulo: "Pedir", icone: "📍" },
      { href: "/app/historico", rotulo: "Histórico", icone: "🧾" },
      { href: "/app/perfil", rotulo: "Perfil", icone: "👤" },
      { href: "/app/avaliacao-prototipo", rotulo: "Avaliar", icone: "⭐" },
    ],
    EMPRESA: [
      { href: "/empresa", rotulo: "Painel", icone: "📋" },
      { href: "/empresa/camioes", rotulo: "Camiões", icone: "🚚" },
      { href: "/empresa/precos", rotulo: "Preços", icone: "💰" },
      { href: "/empresa/historico", rotulo: "Histórico", icone: "🧾" },
      { href: "/empresa/perfil", rotulo: "Perfil", icone: "🏢" },
    ],
    ADMIN: [
      { href: "/admin", rotulo: "Dashboard", icone: "📊" },
      { href: "/admin/empresas", rotulo: "Empresas", icone: "🏢" },
      { href: "/admin/pedidos", rotulo: "Pedidos", icone: "🧾" },
      { href: "/admin/utilizadores", rotulo: "Utilizadores", icone: "👥" },
      { href: "/admin/avaliacoes", rotulo: "Avaliações", icone: "⭐" },
    ],
  }[papel];

  const base = papel === "CONDUTOR" ? "/app" : papel;

  return (
    <nav className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-5xl mx-auto px-3 h-14 flex items-center justify-between gap-2">
        <Link href={base} className="flex items-center gap-2 font-extrabold">
          <span className="w-8 h-8 rounded-lg bg-primary-400 grid place-items-center text-sm">
            🛻
          </span>
          <span className="hidden sm:inline">
            Reboque<span className="text-primary-500">Já</span>
          </span>
        </Link>
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar">
          {itens.map((i) => {
            const activo =
              pathname === i.href || pathname.startsWith(i.href + "/");
            return (
              <Link
                key={i.href}
                href={i.href}
                className={`px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
                  activo
                    ? "bg-primary-100 dark:bg-primary-900/40 text-neutral-900 dark:text-primary-200"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                <span className="mr-1">{i.icone}</span>
                {i.rotulo}
              </Link>
            );
          })}
        </div>
        <button
          onClick={alternar}
          aria-label="Alternar tema"
          className="w-9 h-9 grid place-items-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm"
        >
          {tema === "escuro" ? "☀️" : "🌙"}
        </button>
      </div>
    </nav>
  );
}

export function SairBotao() {
  const [aSair, setASair] = useState(false);
  const sair = async () => {
    setASair(true);
    await fetch("/api/sair", { method: "POST" });
    window.location.href = "/";
  };
  return (
    <button
      onClick={sair}
      disabled={aSair}
      className="text-sm font-semibold text-red-600 dark:text-red-400 px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 min-h-[44px]"
    >
      {aSair ? "A sair…" : "Terminar sessão"}
    </button>
  );
}
