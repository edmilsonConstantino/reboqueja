"use client";

import { useCallback, useEffect, useState } from "react";
import { Cartao, Etiqueta, Carregando, Vazio, Selector, Entrada } from "@/components/ui";
import { faixaPrecoTexto, formatarDataHora, formatarKm } from "@/lib/format";
import { LABEL_ESTADO } from "@/lib/constants-client";
import { ESTADOS_PEDIDO } from "@/lib/constants";

type Pedido = {
  id: string;
  estado: string;
  origemEndereco: string;
  destinoEndereco: string;
  distanciaKm: number;
  precoMin: number;
  precoMax: number;
  criadoEm: string;
  condutor: { nome: string; telefone: string };
  empresa: { nome: string } | null;
  camiao: { matricula: string } | null;
  avaliacao: { estrelas: number } | null;
};

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [empresas, setEmpresas] = useState<{ id: string; nome: string }[]>([]);
  const [estado, setEstado] = useState("");
  const [empresaId, setEmpresaId] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const carregar = useCallback(async () => {
    const params = new URLSearchParams();
    if (estado) params.set("estado", estado);
    if (empresaId) params.set("empresaId", empresaId);
    if (de) params.set("de", de);
    if (ate) params.set("ate", ate);
    const res = await fetch(`/api/admin/pedidos?${params.toString()}`, { cache: "no-store" });
    const d = await res.json();
    if (res.ok) {
      setPedidos(d.pedidos);
      setEmpresas(d.empresas);
    }
  }, [estado, empresaId, de, ate]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (!pedidos) return <div className="p-6"><Carregando /></div>;

  const corEstado = (s: string) =>
    s === "CONCLUIDO" ? "verde" : s === "CANCELADO" ? "vermelho" : s === "PENDENTE" ? "amarelo" : "azul";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-2xl font-extrabold">Todos os pedidos</h1>

      {/* Filtros */}
      <Cartao className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Selector rotulo="Estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos</option>
          {ESTADOS_PEDIDO.map((s) => (
            <option key={s} value={s}>{LABEL_ESTADO[s]}</option>
          ))}
        </Selector>
        <Selector rotulo="Empresa" value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}>
          <option value="">Todas</option>
          {empresas.map((e) => (
            <option key={e.id} value={e.id}>{e.nome}</option>
          ))}
        </Selector>
        <Entrada rotulo="De" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
        <Entrada rotulo="Até" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
      </Cartao>

      {pedidos.length === 0 ? (
        <Vazio titulo="Nenhum pedido encontrado" descricao="Ajuste os filtros." />
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
                    👤 {p.condutor.nome} · 🏢 {p.empresa?.nome || "—"}
                    {p.camiao ? ` · 🚚 ${p.camiao.matricula}` : ""}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {formatarDataHora(p.criadoEm)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <Etiqueta cor={corEstado(p.estado)}>{LABEL_ESTADO[p.estado]}</Etiqueta>
                  <p className="text-xs font-bold mt-2 text-primary-600 dark:text-primary-400">
                    {faixaPrecoTexto(p.precoMin, p.precoMax)}
                  </p>
                  {p.avaliacao && (
                    <p className="text-xs text-primary-500 mt-1">★ {p.avaliacao.estrelas}</p>
                  )}
                </div>
              </div>
            </Cartao>
          ))}
        </div>
      )}
    </div>
  );
}
