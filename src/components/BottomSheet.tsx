"use client";

import { useEffect, useState, useRef } from "react";

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

// A navbar da app vive agora em ./BarraNavegacaoApp
export { BarraNavegacaoApp } from "./BarraNavegacaoApp";

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
