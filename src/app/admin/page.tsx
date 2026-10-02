"use client";

import { useEffect, useState } from "react";
import { Cartao, Carregando, Etiqueta } from "@/components/ui";
import { LABEL_ESTADO } from "@/lib/constants-client";
import { ORDEM_ESTADOS } from "@/lib/constants-client";

type Dashboard = {
  pedidosPorEstado: { estado: string; _count: number }[];
  empresas: { aprovadas: number; pendentes: number; rejeitadas: number };
  totalUtilizadores: number;
  mediaAvaliacoes: number | null;
  totalAvaliacoes: number;
  tempoMedioRespostaMin: number | null;
  tempoMedioChegadaMin: number | null;
  pedidosPorBairro: { bairro: string; total: number }[];
};

export default function DashboardAdmin() {
  const [dados, setDados] = useState<Dashboard | null>(null);
  const [erroMsg, setErroMsg] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin", { cache: "no-store" });
      const d = await res.json();
      if (res.ok) setDados(d);
      else setErroMsg(d.erro || "Erro ao carregar.");
    })();
  }, []);

  if (erroMsg) return <div className="p-6 text-red-500">{erroMsg}</div>;
  if (!dados) return <div className="p-6"><Carregando /></div>;

  const porEstado = (estado: string) =>
    dados.pedidosPorEstado.find((e) => e.estado === estado)?._count || 0;
  const totalPedidos = dados.pedidosPorEstado.reduce((s, e) => s + e._count, 0);

  const maxBairro = Math.max(1, ...dados.pedidosPorBairro.map((b) => b.total));

  const formatarMin = (m: number | null) =>
    m === null ? "—" : m < 1 ? "<1 min" : `${Math.round(m)} min`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-2xl font-extrabold">Dashboard</h1>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Cartao className="p-4 text-center">
          <p className="text-3xl font-extrabold">{totalPedidos}</p>
          <p className="text-xs text-neutral-500">pedidos totais</p>
        </Cartao>
        <Cartao className="p-4 text-center">
          <p className="text-3xl font-extrabold text-primary-500">
            ★ {dados.mediaAvaliacoes ? dados.mediaAvaliacoes.toFixed(1) : "—"}
          </p>
          <p className="text-xs text-neutral-500">avaliação média ({dados.totalAvaliacoes})</p>
        </Cartao>
        <Cartao className="p-4 text-center">
          <p className="text-3xl font-extrabold">{formatarMin(dados.tempoMedioRespostaMin)}</p>
          <p className="text-xs text-neutral-500">tempo médio de resposta</p>
        </Cartao>
        <Cartao className="p-4 text-center">
          <p className="text-3xl font-extrabold">{formatarMin(dados.tempoMedioChegadaMin)}</p>
          <p className="text-xs text-neutral-500">tempo médio até à chegada</p>
        </Cartao>
      </div>

      {/* Pedidos por estado */}
      <Cartao className="p-5">
        <h2 className="font-extrabold mb-4">Pedidos por estado</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center">
          {ORDEM_ESTADOS.map((estado) => (
            <div key={estado} className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
              <p className="text-xl font-extrabold">{porEstado(estado)}</p>
              <p className="text-[11px] text-neutral-500">{LABEL_ESTADO[estado]}</p>
            </div>
          ))}
          <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-3">
            <p className="text-xl font-extrabold text-red-500">{porEstado("CANCELADO")}</p>
            <p className="text-[11px] text-neutral-500">Cancelado</p>
          </div>
        </div>
      </Cartao>

      {/* Empresas + utilizadores */}
      <div className="grid md:grid-cols-2 gap-3">
        <Cartao className="p-5">
          <h2 className="font-extrabold mb-3">Empresas</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Aprovadas</span><b className="text-emerald-600">{dados.empresas.aprovadas}</b>
            </div>
            <div className="flex justify-between">
              <span>Pendentes</span><b className="text-primary-500">{dados.empresas.pendentes}</b>
            </div>
            <div className="flex justify-between">
              <span>Rejeitadas</span><b className="text-red-500">{dados.empresas.rejeitadas}</b>
            </div>
            <div className="flex justify-between border-t border-neutral-100 dark:border-neutral-800 pt-2">
              <span>Utilizadores registados</span><b>{dados.totalUtilizadores}</b>
            </div>
          </div>
        </Cartao>

        {/* Pedidos por bairro */}
        <Cartao className="p-5">
          <h2 className="font-extrabold mb-3">Pedidos por bairro</h2>
          <div className="space-y-2">
            {dados.pedidosPorBairro.slice(0, 6).map((b) => (
              <div key={b.bairro} className="text-sm">
                <div className="flex justify-between mb-0.5">
                  <span>{b.bairro}</span>
                  <b>{b.total}</b>
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-400 rounded-full"
                    style={{ width: `${(b.total / maxBairro) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {dados.pedidosPorBairro.length === 0 && (
              <p className="text-sm text-neutral-500">Sem dados ainda.</p>
            )}
          </div>
        </Cartao>
      </div>
    </div>
  );
}
