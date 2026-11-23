"use client";

import { useEffect, useState } from "react";
import { Cartao, Carregando, Etiqueta, Estrelas, Vazio } from "@/components/ui";
import { faixaPrecoTexto, formatarDataHora, formatarKm } from "@/lib/format";
import { LABEL_ESTADO, LABEL_PROBLEMA } from "@/lib/constants-client";

type Pedido = {
  id: string;
  estado: string;
  criadoEm: string;
  actualizadoEm: string;
  origemEndereco: string;
  destinoEndereco: string;
  distanciaKm: number;
  tipoProblema: string;
  precoMin: number;
  precoMax: number;
  clienteNome: string;
  avaliacao: { estrelas: number; comentario: string | null } | null;
};

type Resposta = {
  pedidos: Pedido[];
  media: number | null;
  total: number;
  receitaMin: number;
  receitaMax: number;
};

export default function HistoricoCondutor() {
  const [dados, setDados] = useState<Resposta | null>(null);
  const [erroMsg, setErroMsg] = useState("");

  useEffect(() => {
    let vivo = true;
    fetch("/api/condutor/historico", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          if (vivo) setErroMsg(d.erro || "Erro ao carregar o histórico.");
          return;
        }
        if (vivo) setDados(d);
      })
      .catch(() => vivo && setErroMsg("Erro de rede."));
    return () => {
      vivo = false;
    };
  }, []);

  if (!dados) {
    return <div className="p-6">{erroMsg ? <Vazio titulo="Erro" descricao={erroMsg} /> : <Carregando />}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-2xl font-extrabold">Histórico e avaliações</h1>

      <div className="grid grid-cols-3 gap-3">
        <Cartao className="p-4 text-center">
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Serviços</p>
          <p className="text-2xl font-extrabold">{dados.total}</p>
        </Cartao>
        <Cartao className="p-4 text-center">
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Avaliação</p>
          <p className="text-2xl font-extrabold">
            {dados.media ? dados.media.toFixed(1) : "—"}
          </p>
        </Cartao>
        <Cartao className="p-4 text-center">
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Faturação</p>
          <p className="text-sm font-extrabold text-primary-600 dark:text-primary-400">
            {faixaPrecoTexto(dados.receitaMin, dados.receitaMax)}
          </p>
        </Cartao>
      </div>

      {dados.pedidos.length === 0 ? (
        <Cartao className="p-4 text-sm text-neutral-500 dark:text-neutral-400">
          Ainda não concluiu nenhum serviço.
        </Cartao>
      ) : (
        <div className="space-y-3">
          {dados.pedidos.map((p) => (
            <Cartao key={p.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{p.origemEndereco}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    → {p.destinoEndereco}
                  </p>
                </div>
                <Etiqueta cor={p.estado === "CONCLUIDO" ? "verde" : "vermelho"}>
                  {LABEL_ESTADO[p.estado]}
                </Etiqueta>
              </div>

              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {formatarDataHora(p.actualizadoEm)} · {formatarKm(p.distanciaKm)} ·{" "}
                {LABEL_PROBLEMA[p.tipoProblema] ?? p.tipoProblema} · cliente {p.clienteNome} ·{" "}
                {faixaPrecoTexto(p.precoMin, p.precoMax)}
              </p>

              {p.avaliacao && (
                <div className="flex items-center gap-3 pt-1">
                  <Estrelas valor={p.avaliacao.estrelas} tamanho="pequeno" />
                  {p.avaliacao.comentario && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      “{p.avaliacao.comentario}”
                    </p>
                  )}
                </div>
              )}
            </Cartao>
          ))}
        </div>
      )}
    </div>
  );
}
