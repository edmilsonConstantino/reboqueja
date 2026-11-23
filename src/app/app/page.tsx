"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mapa, type MarcadorMapa } from "@/components/Mapa";
import { usarTema } from "@/components/ProvedorTema";
import {
  SolicitacaoLocalizacao,
  type EstadoPermissaoGps,
} from "@/components/SolicitacaoLocalizacao";
import { CENTRO_MATOLA, TIPOS_PROBLEMA, TIPOS_VEICULO_PEDIDO } from "@/lib/constants";
import { estaNaMatola, type LatLng } from "@/lib/geo";

type Passo = "local" | "detalhes";

type PedidoActivo = {
  id: string;
  estado: string;
  origemLat: number;
  origemLng: number;
  origemEndereco: string;
  destinoEndereco: string | null;
  criadoEm: string;
  empresa: { nome: string; telefone: string } | null;
  camiao: {
    matricula: string;
    motoristaNome: string;
    motoristaTelefone: string;
    lat: number;
    lng: number;
  } | null;
  eventos: { estado: string; criadoEm: string }[];
};

const ESTADOS_ACTIVOS = ["PENDENTE", "ACEITE", "A_CAMINHO", "NO_LOCAL", "EM_TRANSPORTE"];

/** Etapas mostradas no acompanhamento de um pedido activo. */
const ETAPAS_PEDIDO = [
  { rotulo: "Avaria reportada", estados: ["PENDENTE", "ACEITE"], icone: IconeCheck },
  { rotulo: "Em deslocamento", estados: ["A_CAMINHO"], icone: IconeCamiao },
  { rotulo: "Chegada ao local", estados: ["NO_LOCAL"], icone: IconePin },
  { rotulo: "Em execução", estados: ["EM_TRANSPORTE"], icone: IconeReboque },
];

/** Etapas do fluxo de criação de um pedido. */
const ETAPAS_NOVO = [
  { rotulo: "Local da avaria", icone: IconePin },
  { rotulo: "Detalhes e destino", icone: IconeLista },
  { rotulo: "Escolher veículo", icone: IconePredio },
  { rotulo: "Acompanhar", icone: IconeCamiao },
];

const TITULO_ESTADO: Record<string, { titulo: string; texto: string }> = {
  PENDENTE: {
    titulo: "A aguardar confirmação do condutor.",
    texto: "A tua solicitação foi enviada ao veículo escolhido.",
  },
  ACEITE: {
    titulo: "Pedido aceite",
    texto: "O condutor aceitou o serviço e está a preparar a saída.",
  },
  A_CAMINHO: {
    titulo: "Reboque a caminho",
    texto: "O condutor está a caminho do local indicado.",
  },
  NO_LOCAL: {
    titulo: "Reboque no local",
    texto: "O condutor chegou ao local do veículo avariado.",
  },
  EM_TRANSPORTE: {
    titulo: "Em execução",
    texto: "O serviço de reboque está em curso.",
  },
};

const hora = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }) : "—";

export default function AppCliente() {
  const router = useRouter();
  const { tema } = usarTema();
  const [pos, setPos] = useState<LatLng>(CENTRO_MATOLA);
  const [origemEndereco, setOrigemEndereco] = useState("Marca o local no mapa ou autorize o GPS");
  const [buscaOrigem, setBuscaOrigem] = useState("");
  const [resultadosOrigem, setResultadosOrigem] = useState<{ lat: number; lng: number; label: string }[]>([]);
  const [gpsOk, setGpsOk] = useState<boolean | null>(null);
  const [erroGps, setErroGps] = useState("");
  const [gpsEstado, setGpsEstado] = useState<EstadoPermissaoGps>("checking");
  const [gatilhoGps, setGatilhoGps] = useState(0);
  const [passo, setPasso] = useState<Passo>("local");
  const [erroMsg, setErroMsg] = useState("");
  const [aBuscar, setABuscar] = useState(false);
  const [activo, setActivo] = useState<PedidoActivo | null>(null);
  const [aCarregar, setACarregar] = useState(true);

  // Destino (opcional)
  const [buscaDestino, setBuscaDestino] = useState("");
  const [resultados, setResultados] = useState<{ lat: number; lng: number; label: string }[]>([]);
  const [destino, setDestino] = useState<{ lat: number; lng: number; label: string } | null>(null);

  // Detalhes
  const [tipoProblema, setTipoProblema] = useState("AVARIA_MECANICA");
  const [problemaAlterado, setProblemaAlterado] = useState(false);
  const [detalhesProblema, setDetalhesProblema] = useState("");
  const [tipoVeiculo, setTipoVeiculo] = useState("LIGEIRO");
  const [detalhesVeiculo, setDetalhesVeiculo] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const formRef = useRef<HTMLDivElement>(null);

  const buscarEndereco = useCallback(async (p: LatLng) => {
    try {
      const res = await fetch(`/api/reverse?lat=${p.lat}&lng=${p.lng}`);
      const d = await res.json();
      setOrigemEndereco(d.label || `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`);
    } catch {
      setOrigemEndereco(`${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`);
    }
  }, []);

  const aplicarLocalizacaoGps = useCallback(
    async (p: LatLng) => {
      setErroGps("");
      setPos(p);
      setGpsOk(estaNaMatola(p));
      await buscarEndereco(p);
    },
    [buscarEndereco]
  );

  const localizar = useCallback(() => {
    setErroGps("");
    if (gpsEstado !== "granted") {
      setGatilhoGps((n) => n + 1);
      return;
    }
    if (!navigator.geolocation) {
      setErroGps(
        "Não foi possível obter a tua localização. Activa a localização do dispositivo e concede autorização à aplicação."
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        await aplicarLocalizacaoGps({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      () => {
        setGatilhoGps((n) => n + 1);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [gpsEstado, aplicarLocalizacaoGps]);

  // Pedido activo (se existir)
  useEffect(() => {
    let vivo = true;
    const carregar = async () => {
      try {
        const res = await fetch("/api/minha-conta/pedidos", { cache: "no-store" });
        const d = await res.json();
        const p = (d.pedidos as PedidoActivo[] | undefined)?.find((x) => ESTADOS_ACTIVOS.includes(x.estado));
        if (vivo) setActivo(p ?? null);
      } catch {
        /* sem pedido activo */
      } finally {
        if (vivo) setACarregar(false);
      }
    };
    carregar();
    const t = setInterval(carregar, 5000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, []);

  // Pesquisa de endereço de origem (com debounce)
  useEffect(() => {
    if (buscaOrigem.trim().length < 3) {
      setResultadosOrigem([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(buscaOrigem)}`);
        const d = await res.json();
        setResultadosOrigem(d.resultados || []);
      } catch {
        setResultadosOrigem([]);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [buscaOrigem]);

  // Pesquisa de destino opcional (com debounce)
  useEffect(() => {
    if (buscaDestino.trim().length < 3 || destino) {
      setResultados([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(buscaDestino)}`);
        const d = await res.json();
        setResultados(d.resultados || []);
      } catch {
        setResultados([]);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [buscaDestino, destino]);

  const aoClicarMapa = useCallback(
    (p: LatLng) => {
      if (activo) return;
      setErroGps("");
      setPos(p);
      setGpsOk(estaNaMatola(p));
      buscarEndereco(p);
    },
    [buscarEndereco, activo]
  );

  const continuar = () => {
    setErroMsg("");
    if (!estaNaMatola(pos)) {
      setErroMsg("O local do veículo está fora da área de cobertura (Matola e Zimpeto).");
      return;
    }
    setPasso("detalhes");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const procurarReboques = () => {
    setErroMsg("");
    if (!estaNaMatola(pos)) {
      setErroMsg("O local da avaria está fora da área de cobertura (Matola e Zimpeto).");
      return;
    }
    if (destino && !estaNaMatola(destino)) {
      setErroMsg("O destino está fora da área de cobertura. Escolha um destino na Matola ou em Zimpeto.");
      return;
    }
    setABuscar(true);
    sessionStorage.setItem(
      "rj-rascunho",
      JSON.stringify({
        origemLat: pos.lat,
        origemLng: pos.lng,
        origemEndereco,
        destinoLat: destino ? destino.lat : null,
        destinoLng: destino ? destino.lng : null,
        destinoEndereco: destino ? destino.label : null,
        tipoProblema,
        detalhesProblema: detalhesProblema.trim(),
        tipoVeiculo,
        detalhesVeiculo: tipoVeiculo === "OUTRO" ? detalhesVeiculo.trim() : "",
        observacoes,
      })
    );
    router.push("/app/pedido/novo");
  };

  // ---------- Dados do mapa ----------
  const posMapa: LatLng = activo ? { lat: activo.origemLat, lng: activo.origemLng } : pos;
  const marcadores = useMemo<MarcadorMapa[]>(() => {
    const m: MarcadorMapa[] = [
      {
        id: "origem",
        pos: posMapa,
        emoji: "🚗",
        pulso: true,
        cor: !activo && gpsOk === false ? "#EF4444" : "#FFC300",
        titulo: "Local da avaria",
      },
    ];
    if (activo?.camiao && (activo.camiao.lat !== 0 || activo.camiao.lng !== 0)) {
      m.push({
        id: "camiao",
        pos: { lat: activo.camiao.lat, lng: activo.camiao.lng },
        emoji: "🛻",
        cor: "#38bdf8",
        titulo: "Reboque",
      });
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posMapa.lat, posMapa.lng, gpsOk, activo?.camiao?.lat, activo?.camiao?.lng, !!activo]);

  // ---------- Etapas ----------
  const indiceActivo = activo ? ETAPAS_PEDIDO.findIndex((e) => e.estados.includes(activo.estado)) : passo === "local" ? 0 : 1;
  const etapas = activo
    ? ETAPAS_PEDIDO.map((e) => ({
        rotulo: e.rotulo,
        icone: e.icone,
        hora: hora(activo.eventos.find((ev) => e.estados.includes(ev.estado))?.criadoEm ?? (e.estados.includes("PENDENTE") ? activo.criadoEm : undefined)),
      }))
    : ETAPAS_NOVO.map((e) => ({ rotulo: e.rotulo, icone: e.icone, hora: "" }));

  const estadoInfo = activo ? TITULO_ESTADO[activo.estado] : null;

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-slate-100/80 dark:bg-[#070B14] dark:bg-[radial-gradient(ellipse_at_top,rgba(255,195,0,0.06),transparent_60%)] transition-colors duration-200">
      {!aCarregar && !activo && (
        <SolicitacaoLocalizacao
          perfil="CLIENTE"
          aoObterLocalizacao={aplicarLocalizacaoGps}
          aoAlterarEstado={setGpsEstado}
          gatilhoAbrir={gatilhoGps}
        />
      )}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* ===== Cartão com mapa ===== */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0E1629] shadow-sm dark:shadow-2xl">
          <div className="grid lg:grid-cols-[minmax(0,440px)_1fr]">
            {/* Texto e selecção da localização */}
            <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-center gap-4">
              <div className="flex items-center gap-4">
                <span className="w-14 h-14 shrink-0 rounded-2xl bg-amber-500/15 dark:bg-primary-400/15 border border-amber-500/30 dark:border-primary-400/30 text-amber-700 dark:text-primary-400 grid place-items-center">
                  <IconePin className="w-7 h-7" />
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {activo ? "Acompanhar reboque" : "Solicitar reboque"}
                </h1>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {activo
                  ? "Acompanhe em tempo real o estado do seu pedido."
                  : "Indique a localização do veículo avariado através do GPS, endereço ou tocando no mapa."}
              </p>

              {/* Pesquisa por endereço da origem */}
              {!activo && (
                <div className="relative">
                  <input
                    value={buscaOrigem}
                    onChange={(e) => setBuscaOrigem(e.target.value)}
                    placeholder="Pesquisar rua ou bairro da avaria (ex.: Machava)"
                    className={campo}
                  />
                  {resultadosOrigem.length > 0 && (
                    <div className="absolute z-30 mt-2 w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-2xl divide-y divide-neutral-100 dark:divide-white/5 max-h-56 overflow-y-auto">
                      {resultadosOrigem.map((r, i) => (
                        <button
                          key={i}
                          type="button"
                          className="w-full flex items-center gap-2 text-left px-4 py-3 text-sm hover:bg-neutral-50 dark:hover:bg-white/[0.05]"
                          onClick={() => {
                            setPos({ lat: r.lat, lng: r.lng });
                            setOrigemEndereco(r.label);
                            setGpsOk(estaNaMatola({ lat: r.lat, lng: r.lng }));
                            setBuscaOrigem("");
                            setResultadosOrigem([]);
                            setErroGps("");
                          }}
                        >
                          <IconePin className="w-4 h-4 text-primary-500 shrink-0" />
                          <span className="truncate">{r.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={activo ? () => router.push(`/app/pedido/${activo.id}`) : continuar}
                className="group w-full flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111A2E] p-4 text-left transition hover:border-amber-400/60 dark:hover:border-primary-400/50"
              >
                <span
                  className={`w-12 h-12 shrink-0 rounded-full grid place-items-center ${
                    !activo && gpsOk === false
                      ? "bg-red-500/15 text-red-600 dark:text-red-400"
                      : "bg-amber-500/15 dark:bg-primary-400/15 text-amber-700 dark:text-primary-400"
                  }`}
                >
                  <IconeCarro className="w-6 h-6" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs text-slate-500 dark:text-slate-400">Local da avaria</span>
                  <span className="block font-semibold text-slate-900 dark:text-white truncate">
                    {activo ? activo.origemEndereco : origemEndereco}
                  </span>
                </span>
                <IconeSeta className="w-5 h-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-amber-600 dark:group-hover:text-primary-400" />
              </button>

              {!activo && (
                <button
                  type="button"
                  onClick={localizar}
                  className="self-start text-xs font-semibold text-amber-700 dark:text-primary-400 hover:underline"
                >
                  📍 Usar a minha localização actual
                </button>
              )}

              {!activo && erroGps && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  {erroGps}
                </p>
              )}

              {!activo && !erroGps && gpsOk === false && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  Fora da área de cobertura. Toque no mapa dentro da zona assinalada (Matola e Zimpeto).
                </p>
              )}
            </div>

            {/* Mapa */}
            <div className="relative h-[38vh] min-h-[240px] sm:h-[380px] lg:h-auto lg:min-h-[380px]">
              <Mapa
                centro={posMapa}
                zoom={14}
                marcadores={marcadores}
                aoClicar={aoClicarMapa}
                poligonoMatola
                escuro={tema === "escuro"}
                controlos
                aoLocalizar={activo ? undefined : localizar}
                className="absolute inset-0"
              />
              <div
                aria-hidden
                className="hidden lg:block pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white dark:from-[#0E1629] to-transparent"
              />
            </div>
          </div>
        </section>

        {/* ===== Cartão de estado / etapas ===== */}
        <section
          ref={formRef}
          className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0E1629] shadow-sm dark:shadow-2xl p-4 sm:p-6 space-y-5 scroll-mt-20"
        >
          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5">
            {/* Etapas */}
            <div className="rounded-2xl border border-amber-200/70 dark:border-amber-400/15 bg-amber-50/60 dark:bg-[#111A2E] p-4 sm:p-5">
              <ol className="flex w-full">
                {etapas.map((e, i) => {
                  const feito = i < indiceActivo;
                  const actual = i === indiceActivo;
                  const Icone = feito ? IconeCheck : e.icone;
                  return (
                    <li key={e.rotulo} className="relative flex-1 min-w-0">
                      {i < etapas.length - 1 && (
                        <span
                          aria-hidden
                          className={`absolute top-5 sm:top-6 left-10 sm:left-14 right-1 h-0.5 rounded-full ${
                            feito ? "bg-emerald-500" : actual ? "bg-primary-400" : "bg-neutral-200 dark:bg-white/10"
                          }`}
                        />
                      )}
                      <span
                        className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full grid place-items-center border-2 transition ${
                          feito
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : actual
                              ? "border-primary-400 text-primary-500 dark:text-primary-400 bg-primary-400/10 shadow-[0_0_0_4px_rgba(255,195,0,0.12)]"
                              : "border-neutral-300 dark:border-white/15 text-neutral-400"
                        }`}
                      >
                        <Icone className="w-4 h-4 sm:w-5 sm:h-5" />
                      </span>
                      <p
                        className={`mt-2 sm:mt-3 text-[11px] sm:text-sm font-semibold leading-tight pr-1 sm:pr-2 ${
                          feito || actual ? "" : "text-neutral-400 dark:text-neutral-500"
                        }`}
                      >
                        {e.rotulo}
                      </p>
                      {activo && (
                        <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">{feito || actual ? e.hora : "—"}</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Painel lateral */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="w-14 h-14 shrink-0 rounded-full border-2 border-amber-500 dark:border-primary-400 text-amber-700 dark:text-primary-400 grid place-items-center">
                  {activo ? <IconeCamiao className="w-7 h-7" /> : <IconeRaio className="w-7 h-7" />}
                </span>
                <div>
                  <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                    {aCarregar
                      ? "A verificar…"
                      : estadoInfo?.titulo ?? (passo === "local" ? "Confirmar recolha" : "Detalhes do serviço")}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {estadoInfo?.texto ??
                      (passo === "local"
                        ? "Confirme o local da avaria para pesquisar veículos disponíveis."
                        : "Indique o tipo de veículo, problema e, se necessário, o destino.")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111A2E] divide-x divide-slate-200 dark:divide-white/10">
                {activo ? (
                  <>
                    <InfoMini
                      icone={<IconeUtilizador className="w-5 h-5" />}
                      rotulo="Condutor"
                      valor={activo.camiao?.motoristaNome ?? activo.empresa?.nome ?? "A confirmar"}
                    />
                    <InfoMini
                      icone={<IconeCarro className="w-5 h-5" />}
                      rotulo="Camião"
                      valor={activo.camiao?.matricula ?? "A confirmar"}
                    />
                  </>
                ) : (
                  <>
                    <InfoMini icone={<IconePin className="w-5 h-5" />} rotulo="Cobertura" valor="Matola e Zimpeto" />
                    <InfoMini icone={<IconeEtiqueta className="w-5 h-5" />} rotulo="Comparação" valor="Distância e preço" />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Formulário de detalhes */}
          {!activo && passo === "detalhes" && (
            <div className="grid sm:grid-cols-2 gap-4 rj-fade-up">
              <div className="sm:col-span-2 relative">
                <Rotulo>Destino (opcional): oficina, casa ou outro</Rotulo>
                {destino ? (
                  <div className="w-full flex items-center gap-3 text-left rounded-xl border border-primary-400/40 bg-primary-400/10 px-4 min-h-[48px] text-sm">
                    <IconePin className="w-4 h-4 text-primary-500 dark:text-primary-400 shrink-0" />
                    <span className="flex-1 font-semibold truncate">{destino.label}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDestino(null);
                        setBuscaDestino("");
                      }}
                      className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:underline"
                    >
                      Limpar
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      value={buscaDestino}
                      onChange={(e) => setBuscaDestino(e.target.value)}
                      placeholder="Opcional — ex.: Oficina Auto Geral, Machava"
                      className={campo}
                    />
                    {resultados.length > 0 && (
                      <div className="absolute z-20 mt-2 w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-2xl divide-y divide-neutral-100 dark:divide-white/5 max-h-56 overflow-y-auto">
                        {resultados.map((r, i) => (
                          <button
                            key={i}
                            type="button"
                            className="w-full flex items-center gap-2 text-left px-4 py-3 text-sm hover:bg-neutral-50 dark:hover:bg-white/[0.05]"
                            onClick={() => {
                              setDestino(r);
                              setBuscaDestino(r.label);
                              setResultados([]);
                            }}
                          >
                            <IconePin className="w-4 h-4 text-primary-500 shrink-0" /> {r.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <label className="block">
                <Rotulo>Tipo de problema</Rotulo>
                <select
                  value={tipoProblema}
                  onChange={(e) => {
                    setTipoProblema(e.target.value);
                    setProblemaAlterado(true);
                  }}
                  className={campoSelect}
                  style={{ colorScheme: tema === "escuro" ? "dark" : "light" }}
                >
                  {TIPOS_PROBLEMA.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <Rotulo>Tipo de veículo</Rotulo>
                <select
                  value={tipoVeiculo}
                  onChange={(e) => setTipoVeiculo(e.target.value)}
                  className={campoSelect}
                  style={{ colorScheme: tema === "escuro" ? "dark" : "light" }}
                >
                  {TIPOS_VEICULO_PEDIDO.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              {(tipoProblema === "OUTRO" || problemaAlterado) && (
                <label className="block sm:col-span-2 rj-fade-up">
                  <Rotulo>Detalhes do problema (opcional — pode adicionar qualquer detalhe)</Rotulo>
                  <textarea
                    rows={2}
                    value={detalhesProblema}
                    onChange={(e) => setDetalhesProblema(e.target.value)}
                    placeholder={
                      tipoProblema === "OUTRO"
                        ? "Descreva o problema do veículo (ex.: barulho estranho no motor, fumo, travões bloqueados, não arranca…)"
                        : "Adicione mais detalhes sobre o problema seleccionado (ex.: sintomas, rodas afectadas, se o veículo rola…)"
                    }
                    className={`${campo} py-3 min-h-[76px] resize-y`}
                  />
                  <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                    Estes detalhes são enviados ao condutor de reboque para preparar o equipamento adequado.
                  </span>
                </label>
              )}
              {tipoVeiculo === "OUTRO" && (
                <label className="block sm:col-span-2">
                  <Rotulo>Detalhes do veículo (opcional — pode escrever qualquer detalhe)</Rotulo>
                  <textarea
                    rows={2}
                    value={detalhesVeiculo}
                    onChange={(e) => setDetalhesVeiculo(e.target.value)}
                    placeholder="Não tem a certeza da categoria? Descreva aqui (ex.: marca, cor, carrinha de caixa aberta, mota de carga, tamanho aproximado…)"
                    className={`${campo} py-3 min-h-[76px] resize-y`}
                  />
                  <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                    Mesmo que não saiba o tipo técnico, esta descrição ajuda a empresa a enviar o reboque certo.
                  </span>
                </label>
              )}
              <label className="block sm:col-span-2">
                <Rotulo>Observações (opcional)</Rotulo>
                <input
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex.: veículo na berma direita, portão trancado…"
                  className={campo}
                />
              </label>
            </div>
          )}

          {erroMsg && (
            <div className="text-sm rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300">
              {erroMsg}
            </div>
          )}

          {/* Acção principal */}
          {activo ? (
            <Link href={`/app/pedido/${activo.id}`} className={botaoPrincipal}>
              <IconePin className="w-5 h-5" /> Acompanhar pedido <span aria-hidden>→</span>
            </Link>
          ) : passo === "local" ? (
            <button type="button" onClick={continuar} disabled={aCarregar} className={botaoPrincipal}>
              <IconePin className="w-5 h-5" /> Confirmar localização <span aria-hidden>→</span>
            </button>
          ) : (
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setPasso("local")}
                className="sm:w-48 min-h-[52px] rounded-full border border-neutral-300 dark:border-white/15 font-semibold text-sm hover:bg-neutral-100 dark:hover:bg-white/[0.05] transition"
              >
                ← Voltar
              </button>
              <button
                type="button"
                onClick={procurarReboques}
                disabled={aBuscar}
                className={`${botaoPrincipal} flex-1`}
              >
                {aBuscar ? "A procurar…" : "Procurar reboques disponíveis"} <span aria-hidden>→</span>
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ===== Auxiliares ===== */

const campo =
  "w-full min-h-[48px] px-4 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm outline-none transition focus:border-amber-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-amber-400/30 dark:focus:ring-primary-400/30";

const campoSelect = `${campo} [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-[#0B1120] dark:[&>option]:text-slate-100`;

const botaoPrincipal =
  "w-full min-h-[52px] inline-flex items-center justify-center gap-2 rounded-full bg-primary-400 text-slate-950 font-bold hover:bg-primary-300 active:scale-[0.99] transition shadow-[0_8px_24px_-8px_rgba(255,195,0,0.6)] disabled:opacity-50 disabled:pointer-events-none";

function Rotulo({ children }: { children: React.ReactNode }) {
  return <span className="block text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">{children}</span>;
}

function InfoMini({ icone, rotulo, valor }: { icone: React.ReactNode; rotulo: string; valor: string }) {
  return (
    <div className="flex items-center gap-3 p-4 min-w-0">
      <span className="text-neutral-500 dark:text-neutral-300 shrink-0">{icone}</span>
      <div className="min-w-0">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{rotulo}</p>
        <p className="text-sm font-semibold truncate">{valor}</p>
      </div>
    </div>
  );
}

/* ===== Ícones ===== */

type P = React.SVGProps<SVGSVGElement>;
const svg = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconePin(p: P) {
  return (<svg {...svg} {...p}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>);
}
function IconeCheck(p: P) {
  return (<svg {...svg} strokeWidth={2.5} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>);
}
function IconeCamiao(p: P) {
  return (<svg {...svg} {...p}><path d="M2 16V6h11v10" /><path d="M13 9h4l4 4v3h-8" /><circle cx="7" cy="17.5" r="2" /><circle cx="17" cy="17.5" r="2" /></svg>);
}
function IconeReboque(p: P) {
  return (<svg {...svg} {...p}><path d="M3 16h10V9H3v7Z" /><path d="M13 12h3l3 3v1h-6" /><circle cx="6" cy="17.5" r="1.8" /><circle cx="16" cy="17.5" r="1.8" /><path d="M8 9 12 4h5" /></svg>);
}
function IconeLista(p: P) {
  return (<svg {...svg} {...p}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>);
}
function IconePredio(p: P) {
  return (<svg {...svg} {...p}><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M9 7h1.5M13.5 7H15M9 11h1.5M13.5 11H15M9 15h1.5M13.5 15H15" /><path d="M10.5 21v-3h3v3" /></svg>);
}
function IconeCarro(p: P) {
  return (<svg {...svg} {...p}><path d="M5 17h14v-4l-2-5H7l-2 5v4Z" /><path d="M5 13h14" /><circle cx="8" cy="17" r="1.5" /><circle cx="16" cy="17" r="1.5" /></svg>);
}
function IconeSeta(p: P) {
  return (<svg {...svg} {...p}><path d="m9 6 6 6-6 6" /></svg>);
}
function IconeUtilizador(p: P) {
  return (<svg {...svg} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>);
}
function IconeEtiqueta(p: P) {
  return (<svg {...svg} {...p}><path d="M3 12V4h8l10 10-8 8L3 12Z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>);
}
function IconeRaio(p: P) {
  return (<svg {...svg} {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>);
}
