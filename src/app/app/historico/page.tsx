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
  destinoEndereco: string;
  distanciaKm: number;
  precoMin: number;
  precoMax: number;
  criadoEm: string;
  empresa: { nome: string } | null;
};

export default function HistoricoCondutor() {
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
    estado === "CONCLUIDO" ? "verde" : estado === "CANCELADO" ? "vermelho" : estado === "PENDENTE" ? "amarelo" : "azul";

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
          {pedidos.map((p) => (
            <Link key={p.id} href={`/app/pedido/${p.id}`}>
              <Cartao className="p-4 hover:border-primary-300 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold truncate">{p.origemEndereco}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      → {p.destinoEndereco}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {formatarDataHora(p.criadoEm)} · {formatarKm(p.distanciaKm)}
                      {p.empresa ? ` · ${p.empresa.nome}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Etiqueta cor={corEstado(p.estado)}>{LABEL_ESTADO[p.estado]}</Etiqueta>
                    <p className="text-xs font-bold mt-2 text-primary-600 dark:text-primary-400">
                      {faixaPrecoTexto(p.precoMin, p.precoMax)}
                    </p>
                  </div>
                </div>
              </Cartao>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
