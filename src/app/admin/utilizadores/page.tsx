"use client";

import { useCallback, useEffect, useState } from "react";
import { Cartao, Etiqueta, Carregando, Botao } from "@/components/ui";
import { formatarData } from "@/lib/format";

type Utilizador = {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  papel: string;
  activo: boolean;
  criadoEm: string;
  _count: { pedidos: number };
};

export default function AdminUtilizadores() {
  const [utilizadores, setUtilizadores] = useState<Utilizador[] | null>(null);
  const [aProcessar, setAProcessar] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const res = await fetch("/api/admin/utilizadores", { cache: "no-store" });
    const d = await res.json();
    setUtilizadores(d.utilizadores || []);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const alternar = async (u: Utilizador) => {
    setAProcessar(u.id);
    try {
      await fetch("/api/admin/utilizadores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id, activo: !u.activo }),
      });
      await carregar();
    } finally {
      setAProcessar(null);
    }
  };

  if (!utilizadores) return <div className="p-6"><Carregando /></div>;

  const iconePapel: Record<string, string> = {
    CONDUTOR: "👤",
    EMPRESA: "🏢",
    ADMIN: "🛡️",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-2xl font-extrabold">Utilizadores</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 -mt-3">
        Utilizadores desactivados não conseguem entrar na aplicação.
      </p>

      <div className="space-y-3">
        {utilizadores.map((u) => (
          <Cartao key={u.id} className={`p-4 ${!u.activo ? "opacity-60" : ""}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">
                  {iconePapel[u.papel] || "👤"} {u.nome}
                  {u.papel === "ADMIN" && (
                    <Etiqueta cor="azul">admin</Etiqueta>
                  )}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {u.telefone}
                  {u.email ? ` · ${u.email}` : ""} · registado {formatarData(u.criadoEm)}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {u.papel === "CONDUTOR" ? `${u._count.pedidos} pedido(s)` : u.papel}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Etiqueta cor={u.activo ? "verde" : "vermelho"}>
                  {u.activo ? "Activo" : "Desactivado"}
                </Etiqueta>
                {u.papel !== "ADMIN" && (
                  <button
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg min-h-[36px] ${
                      u.activo
                        ? "text-red-600 bg-red-50 dark:bg-red-950/40"
                        : "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                    }`}
                    onClick={() => alternar(u)}
                    disabled={aProcessar === u.id}
                  >
                    {u.activo ? "Desactivar" : "Activar"}
                  </button>
                )}
              </div>
            </div>
          </Cartao>
        ))}
      </div>
    </div>
  );
}
