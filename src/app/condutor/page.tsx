"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Mapa, type MarcadorMapa } from "@/components/Mapa";
import { usarTema } from "@/components/ProvedorTema";
import { AvisoErro, Botao, Cartao, Carregando, Etiqueta, Vazio } from "@/components/ui";
import { faixaPrecoTexto, formatarKm, formatarTelefone } from "@/lib/format";
import { LABEL_ESTADO, LABEL_PROBLEMA, LABEL_VEICULO } from "@/lib/constants-client";
import { PROXIMO_ESTADO } from "@/lib/constants";
import type { LatLng } from "@/lib/geo";

type Pedido = {
  id: string;
  estado: string;
  criadoEm: string;
  origemLat: number;
  origemLng: number;
  origemEndereco: string;
  destinoLat: number;
  destinoLng: number;
  destinoEndereco: string;
  distanciaKm: number;
  tipoProblema: string;
  tipoVeiculo: string;
  precoMin: number;
  precoMax: number;
  observacoes: string | null;
  cliente: { nome: string; telefone: string };
};

type Painel = {
  condutor: { nome: string };
  camiao: { id: string; matricula: string; tipo: string; activo: boolean } | null;
  empresa: {
    nome: string;
    telefone: string;
    disponivel: boolean;
    estadoAprovacao: string;
  } | null;
  podeReceber: boolean;
  activo: Pedido | null;
  disponiveis: Pedido[];
  media: number | null;
  totalAvaliacoes: number;
  hoje: { concluidos: number; receitaMin: number; receitaMax: number };
};

export default function PainelCondutor() {
  const { tema } = usarTema();
  const [dados, setDados] = useState<Painel | null>(null);
  const [erroMsg, setErroMsg] = useState("");
  const [aProcessar, setAProcessar] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/condutor/painel", { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Erro ao carregar o painel.");
        return;
      }
      setDados(d);
      setErroMsg("");
    } catch {
      setErroMsg("Erro de rede.");
    }
  }, []);

  useEffect(() => {
    carregar();
    const i = setInterval(carregar, 5000);
    return () => clearInterval(i);
  }, [carregar]);

  const aceitar = async (pedidoId: string) => {
    setAProcessar(true);
    setErroMsg("");
    try {
      const res = await fetch("/api/condutor/aceitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId }),
      });
      const d = await res.json();
      if (!res.ok) setErroMsg(d.erro || "Não foi possível aceitar o pedido.");
      await carregar();
    } finally {
      setAProcessar(false);
    }
  };

  const avancar = async () => {
    if (!dados?.activo) return;
    const proximo = PROXIMO_ESTADO[dados.activo.estado];
    if (!proximo) return;
    setAProcessar(true);
    setErroMsg("");
    try {
      const res = await fetch(`/api/condutor/pedidos/${dados.activo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: proximo }),
      });
      const d = await res.json();
      if (!res.ok) setErroMsg(d.erro || "Não foi possível avançar o estado.");
      await carregar();
    } finally {
      setAProcessar(false);
    }
  };

  const marcadores = useMemo<MarcadorMapa[]>(() => {
    if (!dados?.activo) return [];
    const p = dados.activo;
    return [
      { id: "origem", pos: { lat: p.origemLat, lng: p.origemLng }, emoji: "🚗", cor: "#FFC300", pulso: true },
      { id: "destino", pos: { lat: p.destinoLat, lng: p.destinoLng }, emoji: "🏁", cor: "#10B981" },
    ];
  }, [dados?.activo]);

  const centro: LatLng | undefined = dados?.activo
    ? { lat: dados.activo.origemLat, lng: dados.activo.origemLng }
    : undefined;

  if (!dados) {
    return (
      <div className="p-6">
        {erroMsg ? <Vazio titulo="Erro" descricao={erroMsg} /> : <Carregando />}
      </div>
    );
  }

  if (!dados.camiao) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Vazio
          titulo="Sem camião atribuído"
          descricao="A sua conta de condutor ainda não está ligada a um camião. Peça à empresa para o associar em Camiões → Conta de condutor."
        />
      </div>
    );
  }

  const activo = dados.activo;
  const proximo = activo ? PROXIMO_ESTADO[activo.estado] : null;
  const estadoTexto = activo
    ? "Em serviço"
    : dados.podeReceber
      ? "Disponível — à espera de solicitações"
      : "Offline";

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Cabeçalho */}
        <Cartao className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {dados.empresa?.nome ?? "Empresa"}
              </p>
              <h1 className="text-2xl font-extrabold truncate">{dados.condutor.nome}</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                {LABEL_VEICULO[dados.camiao.tipo] ?? dados.camiao.tipo} · {dados.camiao.matricula}
              </p>
            </div>
            <div className="text-right">
              <Etiqueta cor={activo ? "azul" : dados.podeReceber ? "verde" : "cinza"}>
                {estadoTexto}
              </Etiqueta>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                ★ {dados.media ? dados.media.toFixed(1) : "—"} ({dados.totalAvaliacoes})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-neutral-200 dark:border-white/10 text-center">
            <div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Concluídos hoje</p>
              <p className="text-xl font-extrabold">{dados.hoje.concluidos}</p>
            </div>
            <div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Receita hoje</p>
              <p className="text-sm font-extrabold text-primary-600 dark:text-primary-400">
                {faixaPrecoTexto(dados.hoje.receitaMin, dados.hoje.receitaMax)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Pedidos abertos</p>
              <p className="text-xl font-extrabold">{dados.disponiveis.length}</p>
            </div>
          </div>
        </Cartao>

        <AvisoErro>{erroMsg}</AvisoErro>

        {/* Serviço em curso */}
        {activo ? (
          <Cartao className="overflow-hidden">
            <div className="relative h-56">
              <Mapa
                centro={centro}
                zoom={13}
                marcadores={marcadores}
                linha={[
                  { lat: activo.origemLat, lng: activo.origemLng },
                  { lat: activo.destinoLat, lng: activo.destinoLng },
                ]}
                encaixarEm
                escuro={tema === "escuro"}
                className="absolute inset-0"
              />
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-extrabold text-lg">Serviço em curso</h2>
                <Etiqueta cor="azul">{LABEL_ESTADO[activo.estado]}</Etiqueta>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex gap-2.5">
                  <span className="text-primary-500 shrink-0">📍</span>
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Recolha</p>
                    <p className="font-semibold">{activo.origemEndereco}</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <span className="text-emerald-500 shrink-0">🏁</span>
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Destino</p>
                    <p className="font-semibold">{activo.destinoEndereco}</p>
                  </div>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {LABEL_PROBLEMA[activo.tipoProblema] ?? activo.tipoProblema} ·{" "}
                  {LABEL_VEICULO[activo.tipoVeiculo] ?? activo.tipoVeiculo} · {formatarKm(activo.distanciaKm)} ·{" "}
                  {faixaPrecoTexto(activo.precoMin, activo.precoMax)}
                </p>
                {activo.observacoes && (
                  <p className="text-xs rounded-xl bg-neutral-100 dark:bg-white/[0.05] px-3 py-2">
                    {activo.observacoes}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={`tel:${activo.cliente.telefone}`}
                  className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 dark:border-white/15 font-semibold text-sm"
                >
                  📞 Ligar ao cliente ({formatarTelefone(activo.cliente.telefone)})
                </a>
                {proximo && (
                  <Botao className="flex-1" onClick={avancar} disabled={aProcessar}>
                    {aProcessar ? "A guardar…" : `Marcar: ${LABEL_ESTADO[proximo]}`}
                  </Botao>
                )}
              </div>
            </div>
          </Cartao>
        ) : !dados.podeReceber ? (
          <Cartao className="p-6 space-y-2">
            <h2 className="font-extrabold">Não está a receber pedidos</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {dados.empresa?.estadoAprovacao !== "APROVADA"
                ? "A empresa ainda não foi aprovada pelo administrador."
                : !dados.camiao.activo
                  ? "O seu camião está marcado como inactivo. Peça à empresa para o activar."
                  : "A empresa está offline. Assim que ficar online, os pedidos aparecem aqui."}
            </p>
          </Cartao>
        ) : dados.disponiveis.length === 0 ? (
          <Cartao className="p-8 text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary-400/15 grid place-items-center">
              <span className="block w-3 h-3 rounded-full bg-primary-400 animate-ping" />
            </div>
            <h2 className="font-extrabold text-lg">À espera de solicitações…</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              O painel verifica novos pedidos a cada 5 segundos. Mantenha esta página aberta.
            </p>
            <Botao variante="contorno" onClick={carregar}>
              Actualizar agora
            </Botao>
          </Cartao>
        ) : (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold">
                Pedidos disponíveis{" "}
                <span className="ml-1 inline-flex w-6 h-6 items-center justify-center rounded-full bg-primary-400 text-neutral-950 text-xs font-bold">
                  {dados.disponiveis.length}
                </span>
              </h2>
              <Link href="/condutor/historico" className="text-sm font-semibold text-neutral-500 hover:text-primary-500">
                Histórico →
              </Link>
            </div>

            {dados.disponiveis.map((p) => (
              <Cartao key={p.id} className="p-4 border-l-4 border-l-primary-400 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{p.origemEndereco}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      → {p.destinoEndereco}
                    </p>
                  </div>
                  <span className="shrink-0 bg-primary-400/15 text-primary-700 dark:text-primary-300 text-sm font-bold px-2.5 py-1 rounded-lg">
                    {faixaPrecoTexto(p.precoMin, p.precoMax)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <span>🛣️ {formatarKm(p.distanciaKm)}</span>
                  <span>🔧 {LABEL_PROBLEMA[p.tipoProblema] ?? p.tipoProblema}</span>
                  <span>🚗 {LABEL_VEICULO[p.tipoVeiculo] ?? p.tipoVeiculo}</span>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    Cliente: {p.cliente.nome}
                  </p>
                  <Botao onClick={() => aceitar(p.id)} disabled={aProcessar} className="min-w-[130px]">
                    {aProcessar ? "A aceitar…" : "Aceitar pedido"}
                  </Botao>
                </div>
              </Cartao>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
