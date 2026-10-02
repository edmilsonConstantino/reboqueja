"use client";

import { useEffect, useState } from "react";
import { Cartao, Etiqueta, Carregando, Vazio } from "@/components/ui";
import { faixaPrecoTexto, formatarDataHora, formatarKm } from "@/lib/format";
import { LABEL_ESTADO } from "@/lib/constants-client";

type Pedido = {
  id: string;
  estado: string;
  origemEndereco: string;
  destinoEndereco: string;
  distanciaKm: number;
  precoMin: number;
  precoMax: number;
  criadoEm: string;
  condutor: { nome: string };
  camiao: { matricula: string } | null;
  avaliacao: { estrelas: number; comentario: string | null } | null;
};

export default function HistoricoEmpresa() {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/empresa/historico", { cache: "no-store" });
      const d = await res.json();
      setPedidos(d.pedidos || []);
    })();
  }, []);

  if (!pedidos) return <div className="p-6"><Carregando /></div>;

  const concluidos = pedidos.filter((p) => p.estado === "CONCLUIDO");
  const avaliacoes = concluidos.filter((p) => p.avaliacao);
  const media =
    avaliacoes.length > 0
      ? avaliacoes.reduce((s, p) => s + p.avaliacao!.estrelas, 0) / avaliacoes.length
      : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-2xl font-extrabold">Histórico de serviços</h1>

      <div className="grid grid-cols-3 gap-3">
        <Cartao className="p-3 text-center">
          <p className="text-2xl font-extrabold">{concluidos.length}</p>
          <p className="text-xs text-neutral-500">concluídos</p>
        </Cartao>
        <Cartao className="p-3 text-center">
          <p className="text-2xl font-extrabold text-red-500">
            {pedidos.filter((p) => p.estado === "CANCELADO").length}
          </p>
          <p className="text-xs text-neutral-500">cancelados</p>
        </Cartao>
        <Cartao className="p-3 text-center">
          <p className="text-2xl font-extrabold text-primary-500">
            ★ {media ? media.toFixed(1) : "—"}
          </p>
          <p className="text-xs text-neutral-500">avaliação média</p>
        </Cartao>
      </div>

      {pedidos.length === 0 ? (
        <Vazio
          titulo="Sem serviços registados"
          descricao="Os serviços concluídos e cancelados aparecem aqui, com as avaliações recebidas."
        />
      ) : (
        <div className="space-y-3">
          {pedidos.map((p) => (
            <Cartao key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{p.origemEndereco}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    → {p.destinoEndereco} · {formatarKm(p.distanciaKm)}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {p.condutor.nome} · {p.camiao?.matricula || "—"} · {formatarDataHora(p.criadoEm)}
                  </p>
                  {p.avaliacao && (
                    <p className="text-xs mt-1.5">
                      <span className="text-primary-500">{"★".repeat(p.avaliacao.estrelas)}</span>
                      {p.avaliacao.comentario ? ` "${p.avaliacao.comentario}"` : ""}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <Etiqueta cor={p.estado === "CONCLUIDO" ? "verde" : "vermelho"}>
                    {LABEL_ESTADO[p.estado]}
                  </Etiqueta>
                  <p className="text-xs font-bold mt-2 text-primary-600 dark:text-primary-400">
                    {faixaPrecoTexto(p.precoMin, p.precoMax)}
                  </p>
                </div>
              </div>
            </Cartao>
          ))}
        </div>
      )}
    </div>
  );
}
