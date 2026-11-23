"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Mapa, type MarcadorMapa } from "@/components/Mapa";
import { Botao, Cartao, Etiqueta, Vazio, AvisoErro } from "@/components/ui";
import { faixaPrecoTexto, formatarKm, formatarMinutos } from "@/lib/format";
import { LABEL_PROBLEMA, LABEL_VEICULO } from "@/lib/constants-client";
import { RAIOS_PESQUISA_KM, RAIO_PESQUISA_PADRAO_KM } from "@/lib/constants";
import { type LatLng } from "@/lib/geo";

type VeiculoDisponivel = {
  camiaoId: string;
  matricula: string;
  tipoCamiao: string;
  capacidade: string | null;
  motoristaNome: string;
  lat: number;
  lng: number;
  localizacaoActualizadaEm: string;
  empresaId: string;
  empresaNome: string;
  empresaBairro: string;
  media: number | null;
  totalAvaliacoes: number;
  precoMin: number | null;
  precoMax: number | null;
  distanciaLinhaRetaKm: number;
  distanciaEstradaKm: number | null;
  tempoEstimadoMin: number | null;
  fonteRota: "OSRM" | "INDISPONIVEL";
  distanciaServicoKm: number | null;
};

type Rascunho = {
  origemLat: number;
  origemLng: number;
  origemEndereco: string;
  destinoLat?: number | null;
  destinoLng?: number | null;
  destinoEndereco?: string | null;
  tipoProblema: string;
  tipoVeiculo: string;
  detalhesVeiculo?: string | null;
  observacoes?: string | null;
};

type Ordenacao = "proximidade" | "preco" | "avaliacao";

export default function NovoPedido() {
  const router = useRouter();
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [raioKm, setRaioKm] = useState<number>(RAIO_PESQUISA_PADRAO_KM);
  const [veiculos, setVeiculos] = useState<VeiculoDisponivel[]>([]);
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("proximidade");
  const [compararIds, setCompararIds] = useState<string[]>([]);
  const [mostrarComparacao, setMostrarComparacao] = useState(false);
  const [selecionado, setSelecionado] = useState<VeiculoDisponivel | null>(null);
  const [aCarregar, setACarregar] = useState(true);
  const [erroMsg, setErroMsg] = useState("");
  const [aEnviar, setAEnviar] = useState(false);
  const [procuraDecorrida, setProcuraDecorrida] = useState(0);

  useEffect(() => {
    const bruto = sessionStorage.getItem("rj-rascunho");
    if (!bruto) {
      router.replace("/app");
      return;
    }
    try {
      setRascunho(JSON.parse(bruto) as Rascunho);
    } catch {
      router.replace("/app");
    }
  }, [router]);

  const pesquisar = useCallback(
    async (r: Rascunho, raio: number) => {
      setACarregar(true);
      setErroMsg("");
      try {
        const qs = new URLSearchParams({
          origemLat: String(r.origemLat),
          origemLng: String(r.origemLng),
          tipoVeiculo: r.tipoVeiculo,
          raioKm: String(raio),
        });
        if (typeof r.destinoLat === "number" && typeof r.destinoLng === "number") {
          qs.set("destinoLat", String(r.destinoLat));
          qs.set("destinoLng", String(r.destinoLng));
        }
        const res = await fetch(`/api/pedidos?${qs.toString()}`, { cache: "no-store" });
        const d = await res.json();
        if (!res.ok) {
          setErroMsg(d.erro || "Erro ao procurar veículos disponíveis.");
          setVeiculos([]);
          return;
        }
        setVeiculos(d.veiculos || []);
      } catch {
        setErroMsg("Erro de rede ao procurar veículos disponíveis.");
      } finally {
        setACarregar(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!rascunho) return;
    pesquisar(rascunho, raioKm);
  }, [rascunho, raioKm, pesquisar]);

  useEffect(() => {
    if (!aCarregar) {
      setProcuraDecorrida(0);
      return;
    }
    const i = setInterval(() => setProcuraDecorrida((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [aCarregar]);

  const veiculosOrdenados = useMemo(() => {
    const copia = [...veiculos];
    if (ordenacao === "preco") {
      return copia.sort((a, b) => {
        const pa = a.precoMin ?? Number.MAX_SAFE_INTEGER;
        const pb = b.precoMin ?? Number.MAX_SAFE_INTEGER;
        if (pa !== pb) return pa - pb;
        return a.distanciaLinhaRetaKm - b.distanciaLinhaRetaKm;
      });
    }
    if (ordenacao === "avaliacao") {
      return copia.sort((a, b) => {
        const avA = a.media ?? -1;
        const avB = b.media ?? -1;
        if (avA !== avB) return avB - avA;
        return a.distanciaLinhaRetaKm - b.distanciaLinhaRetaKm;
      });
    }
    return copia.sort((a, b) => {
      const ta = a.tempoEstimadoMin ?? a.distanciaLinhaRetaKm * 3;
      const tb = b.tempoEstimadoMin ?? b.distanciaLinhaRetaKm * 3;
      if (ta !== tb) return ta - tb;
      return a.distanciaLinhaRetaKm - b.distanciaLinhaRetaKm;
    });
  }, [veiculos, ordenacao]);

  const veiculosComparacao = useMemo(
    () => veiculosOrdenados.filter((v) => compararIds.includes(v.camiaoId)),
    [veiculosOrdenados, compararIds]
  );

  const alternarComparar = (id: string) => {
    setCompararIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const aumentarRaio = () => {
    const proximo = RAIOS_PESQUISA_KM.find((r) => r > raioKm);
    if (proximo) setRaioKm(proximo);
    else if (rascunho) pesquisar(rascunho, raioKm);
  };

  const confirmarPedido = async () => {
    if (!rascunho || !selecionado) return;
    setAEnviar(true);
    setErroMsg("");
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rascunho,
          camiaoId: selecionado.camiaoId,
          empresaId: selecionado.empresaId,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Não foi possível enviar a solicitação.");
        return;
      }
      sessionStorage.removeItem("rj-rascunho");
      router.push(`/app/pedido/${d.id}`);
    } catch {
      setErroMsg("Erro de rede ao enviar a solicitação.");
    } finally {
      setAEnviar(false);
    }
  };

  if (!rascunho) {
    return (
      <div className="p-6">
        <Vazio
          titulo="Sem dados do pedido"
          descricao="Volte ao ecrã principal para indicar o local da avaria."
          accao={<Botao onClick={() => router.push("/app")}>Voltar</Botao>}
        />
      </div>
    );
  }

  const origem: LatLng = { lat: rascunho.origemLat, lng: rascunho.origemLng };
  const destino: LatLng | null =
    typeof rascunho.destinoLat === "number" && typeof rascunho.destinoLng === "number"
      ? { lat: rascunho.destinoLat, lng: rascunho.destinoLng }
      : null;

  const marcadores: MarcadorMapa[] = [
    { id: "o", pos: origem, emoji: "🚗", cor: "#FFC300", titulo: "Local da avaria" },
    ...(destino ? [{ id: "d", pos: destino, emoji: "🏁", cor: "#10B981", titulo: "Destino" }] : []),
    ...veiculosOrdenados.map((v) => ({
      id: v.camiaoId,
      pos: { lat: v.lat, lng: v.lng },
      emoji: "🚚",
      cor: selecionado?.camiaoId === v.camiaoId ? "#FFC300" : "#0EA5E9",
      pulso: selecionado?.camiaoId === v.camiaoId,
      titulo: `${v.empresaNome} · ${v.matricula}`,
      aoClicar: () => {
        setSelecionado(v);
        setMostrarComparacao(false);
      },
    })),
  ];

  return (
    <div className="fixed inset-0 pt-[calc(3.5rem_+_env(safe-area-inset-top))] pb-[340px]">
      {/* Mapa com origem, destino (se indicado) e TODOS os veículos disponíveis */}
      <Mapa
        centro={origem}
        zoom={13}
        marcadores={marcadores}
        linha={destino ? [origem, destino] : null}
        encaixarEm
        className="absolute inset-0"
      />

      {/* Painel lateral / inferior */}
      <div className="absolute z-30 inset-x-0 bottom-0 top-auto md:inset-y-0 md:left-0 md:right-auto md:w-[440px] md:top-14 max-h-[75vh] md:max-h-none overflow-y-auto rj-sheet-scroll bg-white dark:bg-neutral-900 md:shadow-none shadow-sheet rounded-t-3xl md:rounded-none border-t md:border-t-0 md:border-r border-neutral-200 dark:border-neutral-800 p-4 pb-[calc(1.25rem_+_env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            type="button"
            onClick={() => router.push("/app")}
            className="text-sm text-neutral-500 hover:underline"
          >
            ← Editar local e detalhes
          </button>
          <button
            type="button"
            onClick={() => pesquisar(rascunho, raioKm)}
            className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
          >
            ↻ Actualizar
          </button>
        </div>

        <h1 className="text-lg font-extrabold">Veículos de reboque disponíveis</h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 mb-3">
          {LABEL_PROBLEMA[rascunho.tipoProblema]} · {LABEL_VEICULO[rascunho.tipoVeiculo] ?? rascunho.tipoVeiculo}
          {rascunho.detalhesVeiculo ? ` (${rascunho.detalhesVeiculo})` : ""}
          {rascunho.destinoEndereco ? ` · Destino: ${rascunho.destinoEndereco}` : " · Sem destino definido"}
        </p>

        {/* Controlo de raio + ordenação */}
        <div className="space-y-2 mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-neutral-500 mr-1">Raio:</span>
            {RAIOS_PESQUISA_KM.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRaioKm(r)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                  raioKm === r
                    ? "bg-primary-400 text-neutral-950"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                }`}
              >
                {r} km
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-neutral-500 mr-1">Ordenar:</span>
            {(
              [
                ["proximidade", "Mais próximo"],
                ["preco", "Menor preço"],
                ["avaliacao", "Melhor avaliação"],
              ] as const
            ).map(([k, rotulo]) => (
              <button
                key={k}
                type="button"
                onClick={() => setOrdenacao(k)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                  ordenacao === k
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                }`}
              >
                {rotulo}
              </button>
            ))}
          </div>
        </div>

        {/* Barra de comparação */}
        {compararIds.length >= 2 && (
          <div className="mb-3 p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">
              {compararIds.length} opções seleccionadas para comparar
            </span>
            <button
              type="button"
              onClick={() => setMostrarComparacao((v) => !v)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-sky-600 text-white hover:bg-sky-500"
            >
              {mostrarComparacao ? "Fechar comparação" : "Comparar agora"}
            </button>
          </div>
        )}

        {aCarregar ? (
          <div className="py-10 text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-primary-400/30 rj-radar" />
              <div className="absolute inset-0 rounded-full bg-primary-400/20 rj-radar" style={{ animationDelay: "0.5s" }} />
              <div className="absolute inset-4 rounded-full bg-primary-400/40 rj-radar" style={{ animationDelay: "0.9s" }} />
              <div className="absolute inset-0 grid place-items-center text-3xl">🛻</div>
            </div>
            <p className="font-bold">A procurar veículos disponíveis…</p>
            <p className="text-xs text-neutral-500 mt-1">
              {procuraDecorrida}s · a verificar localização em tempo real e tarifas num raio de {raioKm} km
            </p>
          </div>
        ) : erroMsg ? (
          <div className="space-y-3">
            <AvisoErro>{erroMsg}</AvisoErro>
            <Botao variante="contorno" className="w-full" onClick={() => pesquisar(rascunho, raioKm)}>
              Tentar novamente
            </Botao>
          </div>
        ) : veiculosOrdenados.length === 0 ? (
          <Vazio
            titulo="Sem veículos nas proximidades"
            descricao="Não encontrámos veículos de reboque disponíveis nas proximidades. Experimenta aumentar a área de pesquisa."
            accao={
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {raioKm < RAIOS_PESQUISA_KM[RAIOS_PESQUISA_KM.length - 1] && (
                  <Botao onClick={aumentarRaio}>Aumentar área de pesquisa</Botao>
                )}
                <Botao variante="contorno" onClick={() => router.push("/app")}>
                  Voltar
                </Botao>
              </div>
            }
          />
        ) : mostrarComparacao && veiculosComparacao.length >= 2 ? (
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold">Comparação lado a lado</h2>
            <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <table className="w-full text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-800/60">
                  <tr>
                    <th className="text-left p-2.5 font-semibold">Critério</th>
                    {veiculosComparacao.map((v) => (
                      <th key={v.camiaoId} className="text-left p-2.5 font-bold">
                        {v.empresaNome}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  <tr>
                    <td className="p-2.5 text-neutral-500">Veículo / Condutor</td>
                    {veiculosComparacao.map((v) => (
                      <td key={v.camiaoId} className="p-2.5">
                        {v.matricula} ({LABEL_VEICULO[v.tipoCamiao] || v.tipoCamiao})
                        <br />
                        <span className="text-neutral-500">{v.motoristaNome}</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 text-neutral-500">Linha reta</td>
                    {veiculosComparacao.map((v) => (
                      <td key={v.camiaoId} className="p-2.5 font-semibold">
                        {formatarKm(v.distanciaLinhaRetaKm)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 text-neutral-500">Por estrada</td>
                    {veiculosComparacao.map((v) => (
                      <td key={v.camiaoId} className="p-2.5 font-semibold">
                        {v.distanciaEstradaKm !== null ? formatarKm(v.distanciaEstradaKm) : "Indisponível"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 text-neutral-500">Tempo estimado</td>
                    {veiculosComparacao.map((v) => (
                      <td key={v.camiaoId} className="p-2.5 font-semibold">
                        {v.tempoEstimadoMin !== null ? formatarMinutos(v.tempoEstimadoMin) : "Indisponível"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 text-neutral-500">Preço</td>
                    {veiculosComparacao.map((v) => (
                      <td key={v.camiaoId} className="p-2.5 font-bold text-primary-600 dark:text-primary-400">
                        {v.precoMin !== null && v.precoMax !== null
                          ? faixaPrecoTexto(v.precoMin, v.precoMax)
                          : "Indisponível"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 text-neutral-500">Avaliação</td>
                    {veiculosComparacao.map((v) => (
                      <td key={v.camiaoId} className="p-2.5">
                        {v.media !== null ? `★ ${v.media.toFixed(1)} (${v.totalAvaliacoes})` : "Sem avaliações"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5" />
                    {veiculosComparacao.map((v) => (
                      <td key={v.camiaoId} className="p-2.5">
                        <Botao
                          className="w-full text-xs !min-h-[38px]"
                          onClick={() => {
                            setSelecionado(v);
                            setMostrarComparacao(false);
                          }}
                          disabled={v.precoMin === null}
                        >
                          Escolher
                        </Botao>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : selecionado ? (
          /* Resumo de pré-confirmação */
          <Cartao className="p-4 border-primary-400/50 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  Resumo antes de confirmar
                </p>
                <h2 className="text-base font-extrabold mt-0.5">{selecionado.empresaNome}</h2>
                <p className="text-xs text-neutral-500">
                  Camião {selecionado.matricula} ({LABEL_VEICULO[selecionado.tipoCamiao] || selecionado.tipoCamiao}) · Condutor {selecionado.motoristaNome}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelecionado(null)}
                className="text-xs font-semibold text-neutral-500 hover:underline"
              >
                Trocar
              </button>
            </div>

            <div className="text-xs space-y-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 p-3">
              <p>
                <span className="text-neutral-500">Recolha:</span>{" "}
                <b>{rascunho.origemEndereco}</b>
              </p>
              {rascunho.detalhesVeiculo && (
                <p>
                  <span className="text-neutral-500">Detalhes do veículo:</span>{" "}
                  <b>{rascunho.detalhesVeiculo}</b>
                </p>
              )}
              <p>
                <span className="text-neutral-500">Destino:</span>{" "}
                <b>{rascunho.destinoEndereco || "Não indicado"}</b>
              </p>
              <p>
                <span className="text-neutral-500">Distância em linha reta:</span>{" "}
                <b>{formatarKm(selecionado.distanciaLinhaRetaKm)}</b>
              </p>
              <p>
                <span className="text-neutral-500">Distância por estrada:</span>{" "}
                <b>
                  {selecionado.distanciaEstradaKm !== null
                    ? formatarKm(selecionado.distanciaEstradaKm)
                    : "Indisponível"}
                </b>
              </p>
              <p>
                <span className="text-neutral-500">Tempo estimado de chegada:</span>{" "}
                <b>
                  {selecionado.tempoEstimadoMin !== null
                    ? formatarMinutos(selecionado.tempoEstimadoMin)
                    : "Indisponível"}
                </b>
              </p>
              <p>
                <span className="text-neutral-500">Preço estimado:</span>{" "}
                <b className="text-primary-600 dark:text-primary-400">
                  {selecionado.precoMin !== null && selecionado.precoMax !== null
                    ? faixaPrecoTexto(selecionado.precoMin, selecionado.precoMax)
                    : "Sem tabela configurada"}
                </b>
              </p>
            </div>

            <AvisoErro>{erroMsg}</AvisoErro>

            <div className="flex gap-2">
              <Botao
                variante="contorno"
                className="flex-1"
                onClick={() => setSelecionado(null)}
                disabled={aEnviar}
              >
                Voltar à lista
              </Botao>
              <Botao
                className="flex-1"
                onClick={confirmarPedido}
                disabled={aEnviar || selecionado.precoMin === null}
              >
                {aEnviar ? "A enviar…" : "Confirmar solicitação"}
              </Botao>
            </div>
          </Cartao>
        ) : (
          /* Lista de todos os veículos disponíveis */
          <div className="space-y-3">
            <p className="text-xs text-neutral-500">
              {veiculosOrdenados.length} veículo(s) encontrado(s) num raio de {raioKm} km
            </p>
            {veiculosOrdenados.map((v) => {
              const emComparacao = compararIds.includes(v.camiaoId);
              return (
                <Cartao key={v.camiaoId} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold truncate">{v.empresaNome}</h3>
                      <p className="text-xs text-neutral-500">
                        🚚 {v.matricula} ({LABEL_VEICULO[v.tipoCamiao] || v.tipoCamiao}) · {v.motoristaNome}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {v.media !== null
                          ? `★ ${v.media.toFixed(1)} (${v.totalAvaliacoes} avaliações)`
                          : "Sem avaliações"}{" "}
                        · {v.empresaBairro}
                      </p>
                    </div>
                    <Etiqueta cor={v.tempoEstimadoMin !== null ? "azul" : "cinza"}>
                      {v.tempoEstimadoMin !== null
                        ? formatarMinutos(v.tempoEstimadoMin)
                        : "Tempo indisp."}
                    </Etiqueta>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-2.5">
                    <div>
                      <span className="text-neutral-500 block">Linha reta</span>
                      <b>{formatarKm(v.distanciaLinhaRetaKm)}</b>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Por estrada</span>
                      <b>
                        {v.distanciaEstradaKm !== null
                          ? formatarKm(v.distanciaEstradaKm)
                          : "Indisponível"}
                      </b>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="font-extrabold text-primary-600 dark:text-primary-400">
                      {v.precoMin !== null && v.precoMax !== null
                        ? faixaPrecoTexto(v.precoMin, v.precoMax)
                        : "Sem preço configurado"}
                    </span>
                    <button
                      type="button"
                      onClick={() => alternarComparar(v.camiaoId)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
                        emComparacao
                          ? "border-sky-500 bg-sky-500/15 text-sky-600 dark:text-sky-300"
                          : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      {emComparacao ? "✓ A comparar" : "+ Comparar"}
                    </button>
                  </div>

                  <Botao
                    className="w-full"
                    onClick={() => setSelecionado(v)}
                    disabled={v.precoMin === null}
                  >
                    Seleccionar veículo
                  </Botao>
                </Cartao>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
