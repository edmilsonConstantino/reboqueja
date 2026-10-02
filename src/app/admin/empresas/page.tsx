"use client";

import { useCallback, useEffect, useState } from "react";
import { Botao, Cartao, Etiqueta, Carregando, Vazio } from "@/components/ui";
import { formatarData } from "@/lib/format";

type Empresa = {
  id: string;
  nome: string;
  nuit: string;
  telefone: string;
  email: string;
  endereco: string;
  raioKm: number;
  disponivel: boolean;
  estadoAprovacao: string;
  consentimentoEm: string | null;
  utilizador: { nome: string; telefone: string; email: string };
  _count: { camioes: number; pedidos: number };
};

export default function AdminEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[] | null>(null);
  const [erroMsg, setErroMsg] = useState("");
  const [aProcessar, setAProcessar] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<"TODAS" | "PENDENTE" | "APROVADA" | "REJEITADA">("TODAS");

  const carregar = useCallback(async () => {
    const res = await fetch("/api/admin/empresas", { cache: "no-store" });
    const d = await res.json();
    if (res.ok) setEmpresas(d.empresas);
    else setErroMsg(d.erro || "Erro ao carregar.");
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const decidir = async (id: string, decisao: "APROVADA" | "REJEITADA") => {
    setAProcessar(id);
    setErroMsg("");
    try {
      const res = await fetch("/api/admin/empresas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decisao }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Erro ao processar.");
        return;
      }
      await carregar();
    } finally {
      setAProcessar(null);
    }
  };

  if (!empresas) return <div className="p-6"><Carregando /></div>;

  const filtradas =
    filtro === "TODAS" ? empresas : empresas.filter((e) => e.estadoAprovacao === filtro);

  const corEstado = (s: string) =>
    s === "APROVADA" ? "verde" : s === "PENDENTE" ? "amarelo" : "vermelho";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-2xl font-extrabold">Empresas</h1>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(["TODAS", "PENDENTE", "APROVADA", "REJEITADA"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold min-h-[44px] ${
              filtro === f
                ? "bg-primary-400 text-neutral-900"
                : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700"
            }`}
          >
            {f === "TODAS" ? "Todas" : f}
            {f !== "TODAS" && ` (${empresas.filter((e) => e.estadoAprovacao === f).length})`}
          </button>
        ))}
      </div>

      <Aviso>{erroMsg}</Aviso>

      {filtradas.length === 0 ? (
        <Vazio titulo="Nenhuma empresa neste estado" />
      ) : (
        <div className="space-y-3">
          {filtradas.map((e) => (
            <Cartao key={e.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold">{e.nome}</h2>
                    <Etiqueta cor={corEstado(e.estadoAprovacao)}>{e.estadoAprovacao}</Etiqueta>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    NUIT {e.nuit} · {e.endereco}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    📞 {e.telefone} · ✉ {e.email} · raio {e.raioKm} km
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    🚚 {e._count.camioes} camiões · 🧾 {e._count.pedidos} pedidos
                  </p>
                  <p className="text-xs mt-1.5">
                    {e.consentimentoEm ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✔ Consentimento dado em {formatarData(e.consentimentoEm)}
                      </span>
                    ) : (
                      <span className="text-red-500 font-semibold">✖ Sem consentimento</span>
                    )}
                  </p>
                </div>
              </div>

              {e.estadoAprovacao !== "APROVADA" && (
                <div className="flex gap-2 mt-4">
                  <Botao
                    variante="sucesso"
                    className="flex-1"
                    onClick={() => decidir(e.id, "APROVADA")}
                    disabled={aProcessar === e.id || !e.consentimentoEm}
                  >
                    ✔ Aprovar
                  </Botao>
                  {e.estadoAprovacao !== "REJEITADA" && (
                    <Botao
                      variante="perigo"
                      className="flex-1"
                      onClick={() => decidir(e.id, "REJEITADA")}
                      disabled={aProcessar === e.id}
                    >
                      ✖ Rejeitar
                    </Botao>
                  )}
                </div>
              )}
              {e.estadoAprovacao === "APROVADA" && (
                <div className="flex gap-2 mt-4">
                  <Botao
                    variante="perigo"
                    className="flex-1"
                    onClick={() => decidir(e.id, "REJEITADA")}
                    disabled={aProcessar === e.id}
                  >
                    Revogar aprovação
                  </Botao>
                </div>
              )}
            </Cartao>
          ))}
        </div>
      )}
    </div>
  );
}

function Aviso({ children }: { children: React.ReactNode }) {
  return <AvisoInline>{children}</AvisoInline>;
}

function AvisoInline({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3 border border-red-200 dark:border-red-900">
      {children}
    </div>
  );
}
