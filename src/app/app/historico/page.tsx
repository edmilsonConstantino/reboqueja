"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Botao, Cartao, Etiqueta, Carregando, Vazio } from "@/components/ui";
import { faixaPrecoTexto, formatarDataHora, formatarKm } from "@/lib/format";
import { LABEL_ESTADO } from "@/lib/constants-client";

type PedidoResumo = {
  id: string;
  estado: string;
  origemEndereco: string;
  destinoEndereco: string | null;
  distanciaKm: number;
  precoMin: number;
  precoMax: number;
  criadoEm: string;
  empresa: { nome: string } | null;
  avaliacao: { estrelas: number; comentario: string | null } | null;
};

export default function HistoricoCliente() {
  const [pedidos, setPedidos] = useState<PedidoResumo[] | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/minha-conta/pedidos", { cache: "no-store" });
      const d = await res.json();
      setPedidos(d.pedidos || []);
    })();
  }, []);

  if (!pedidos) return <div className="p-6"><Carregando /></div>;

  const corEstado = (estado: string) =>
    estado === "CONCLUIDO"
      ? "verde"
      : estado === "CANCELADO" || estado === "RECUSADO"
        ? "vermelho"
        : estado === "PENDENTE"
          ? "amarelo"
          : "azul";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-extrabold mb-6">Os meus pedidos</h1>
      {pedidos.length === 0 ? (
        <Vazio
          titulo="Ainda não fez pedidos"
          descricao="Quando precisar de um reboque, abra o ecrã principal e faça o primeiro pedido."
          accao={<Link href="/app"><Botao>Pedir reboque</Botao></Link>}
        />
      ) : (
        <div className="space-y-3">
          {pedidos.map((p) => {
            const concluido = p.estado === "CONCLUIDO";
            const podeAvaliar = concluido && !p.avaliacao;
            return (
              <Cartao key={p.id} className="p-4">
                <Link
                  href={`/app/pedido/${p.id}`}
                  className="block hover:opacity-90 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold truncate">{p.origemEndereco}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        → {p.destinoEndereco || "Destino não indicado"}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {formatarDataHora(p.criadoEm)} · {formatarKm(p.distanciaKm)}
                        {p.empresa ? ` · ${p.empresa.nome}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Etiqueta cor={corEstado(p.estado)}>{LABEL_ESTADO[p.estado] || p.estado}</Etiqueta>
                      <p className="text-xs font-bold mt-2 text-primary-600 dark:text-primary-400">
                        {faixaPrecoTexto(p.precoMin, p.precoMax)}
                      </p>
                    </div>
                  </div>
                </Link>

                {concluido && (
                  <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
                    {p.avaliacao ? (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Avaliou com{" "}
                        <b className="text-primary-500 dark:text-primary-400">
                          {"★".repeat(p.avaliacao.estrelas)}
                        </b>
                        {p.avaliacao.comentario ? " · obrigado pelo comentário" : ""}
                      </p>
                    ) : (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Serviço concluído — deixe a sua avaliação.
                      </p>
                    )}
                    <Link
                      href={podeAvaliar ? `/app/pedido/${p.id}/concluir` : `/app/pedido/${p.id}`}
                      className={`inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 rounded-xl text-xs font-bold transition ${
                        podeAvaliar
                          ? "bg-primary-400 text-neutral-950 hover:bg-primary-300"
                          : "border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      }`}
                    >
                      {podeAvaliar ? "⭐ Avaliar serviço" : "Ver pedido"}
                    </Link>
                  </div>
                )}
              </Cartao>
            );
          })}
        </div>
      )}
    </div>
  );
}
