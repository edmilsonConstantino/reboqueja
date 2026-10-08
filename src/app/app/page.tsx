"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mapa, type MarcadorMapa } from "@/components/Mapa";
import { usarTema } from "@/components/ProvedorTema";
import { CENTRO_MATOLA, TIPOS_PROBLEMA, TIPOS_VEICULO } from "@/lib/constants";
import { estaNaMatola, type LatLng } from "@/lib/geo";

type Passo = "local" | "detalhes";

type PedidoActivo = {
  id: string;
  estado: string;
  origemLat: number;
  origemLng: number;
  origemEndereco: string;
  destinoEndereco: string;
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
  { rotulo: "Em transporte", estados: ["EM_TRANSPORTE"], icone: IconeReboque },
];

/** Etapas do fluxo de criação de um pedido. */
const ETAPAS_NOVO = [
  { rotulo: "Local da avaria", icone: IconePin },
  { rotulo: "Destino e detalhes", icone: IconeLista },
  { rotulo: "Escolher empresa", icone: IconePredio },
  { rotulo: "Acompanhar", icone: IconeCamiao },
];

const TITULO_ESTADO: Record<string, { titulo: string; texto: string }> = {
  PENDENTE: { titulo: "À espera de uma empresa", texto: "O seu pedido foi enviado. Aguarde a confirmação." },
  ACEITE: { titulo: "Pedido aceite", texto: "A empresa aceitou o pedido e está a preparar o camião." },
  A_CAMINHO: { titulo: "Reboque a caminho", texto: "O motorista está a caminho do seu local." },
  NO_LOCAL: { titulo: "Reboque no local", texto: "O motorista chegou ao local do veículo." },
  EM_TRANSPORTE: { titulo: "Em transporte", texto: "O seu veículo está a ser levado ao destino." },
};

const hora = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }) : "—";

export default function AppCondutor() {
  const router = useRouter();
  const { tema } = usarTema();
  const [pos, setPos] = useState<LatLng>(CENTRO_MATOLA);
  const [origemEndereco, setOrigemEndereco] = useState("A localizar…");
  const [gpsOk, setGpsOk] = useState<boolean | null>(null);
  const [passo, setPasso] = useState<Passo>("local");
  const [erroMsg, setErroMsg] = useState("");
  const [aBuscar, setABuscar] = useState(false);
  const [activo, setActivo] = useState<PedidoActivo | null>(null);
  const [aCarregar, setACarregar] = useState(true);

  // Destino
  const [buscaDestino, setBuscaDestino] = useState("");
  const [resultados, setResultados] = useState<{ lat: number; lng: number; label: string }[]>([]);
  const [destino, setDestino] = useState<{ lat: number; lng: number; label: string } | null>(null);

  // Detalhes
  const [tipoProblema, setTipoProblema] = useState("AVARIA_MECANICA");
  const [tipoVeiculo, setTipoVeiculo] = useState("LIGEIRO");
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

  const localizar = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsOk(false);
      setOrigemEndereco("GPS indisponível — toque no mapa para marcar o local");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const p2 = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(p2);
        setGpsOk(estaNaMatola(p2));
        await buscarEndereco(p2);
      },
      () => {
        setGpsOk(false);
        setOrigemEndereco("Sem GPS — toque no mapa para marcar o local");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [buscarEndereco]);

  // Pedido activo (se existir) + GPS inicial
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
    localizar();
    const t = setInterval(carregar, 5000); // actualiza o estado em tempo real
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, [localizar]);

  // Pesquisa de destino (com debounce)
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
    }, 500);
    return () => clearTimeout(t);
  }, [buscaDestino, destino]);

  const aoClicarMapa = useCallback(
    (p: LatLng) => {
      if (activo) return;
      setPos(p);
      setGpsOk(estaNaMatola(p));
      buscarEndereco(p);
    },
    [buscarEndereco, activo]
  );

  const continuar = () => {
    setErroMsg("");
    if (!estaNaMatola(pos)) {
      setErroMsg("O local do veículo está fora dos limites da Cidade da Matola. O serviço só cobre a Matola.");
      return;
    }
    setPasso("detalhes");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const verEmpresas = () => {
    setErroMsg("");
    if (!destino) {
      setErroMsg("Escolha o destino do reboque.");
      return;
    }
    if (!estaNaMatola(destino)) {
      setErroMsg("O destino está fora dos limites da Cidade da Matola. Escolha um destino dentro da cidade.");
      return;
    }
    setABuscar(true);
    sessionStorage.setItem(
      "rj-rascunho",
      JSON.stringify({
        origemLat: pos.lat,
        origemLng: pos.lng,
        origemEndereco,
        destinoLat: destino.lat,
        destinoLng: destino.lng,
        destinoEndereco: destino.label,
        tipoProblema,
        tipoVeiculo,
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
      },
    ];
    if (activo?.camiao && (activo.camiao.lat !== 0 || activo.camiao.lng !== 0)) {
      m.push({ id: "camiao", pos: { lat: activo.camiao.lat, lng: activo.camiao.lng }, emoji: "🛻", cor: "#38bdf8" });
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
    <div className="min-h-[calc(100vh-3.5rem)] bg-neutral-50 dark:bg-[radial-gradient(ellipse_at_top,rgba(255,195,0,0.06),transparent_60%)] dark:bg-neutral-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* ===== Cartão com mapa ===== */}
        <section className="relative overflow-hidden rounded-3xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 shadow-card">
          <div className="grid lg:grid-cols-[minmax(0,420px)_1fr]">
            {/* Texto */}
            <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-center gap-5">
              <div className="flex items-center gap-4">
                <span className="w-14 h-14 shrink-0 rounded-2xl bg-primary-400/15 border border-primary-400/30 text-primary-500 dark:text-primary-400 grid place-items-center">
                  <IconePin className="w-7 h-7" />
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {activo ? "Acompanhe o seu reboque" : "Onde está o veículo?"}
                </h1>
              </div>
              <p className="text-neutral-500 dark:text-neutral-400">
                {activo
                  ? "Acompanhe em tempo real o estado do seu pedido."
                  : "Usamos o GPS para marcar o local. Toque no mapa para ajustar."}
              </p>

              <button
                type="button"
                onClick={activo ? () => router.push(`/app/pedido/${activo.id}`) : continuar}
                className="group w-full flex items-center gap-4 rounded-2xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.04] p-4 text-left transition hover:border-primary-400/50"
              >
                <span
                  className={`w-12 h-12 shrink-0 rounded-full grid place-items-center ${
                    !activo && gpsOk === false
                      ? "bg-red-500/15 text-red-500"
                      : "bg-primary-400/15 text-primary-500 dark:text-primary-400"
                  }`}
                >
                  <IconeCarro className="w-6 h-6" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400">Local da avaria</span>
                  <span className="block font-semibold truncate">
                    {activo ? activo.origemEndereco : origemEndereco}
                  </span>
                </span>
                <IconeSeta className="w-5 h-5 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-primary-400" />
              </button>

              {!activo && gpsOk === false && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  Fora dos limites da Cidade da Matola. Toque no mapa dentro da zona amarela.
                </p>
              )}
            </div>

            {/* Mapa */}
            <div className="relative h-[300px] sm:h-[360px] lg:h-auto lg:min-h-[360px]">
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
              {/* Esbate a transição entre texto e mapa (desktop) */}
              <div
                aria-hidden
                className="hidden lg:block pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white dark:from-neutral-900 to-transparent"
              />
            </div>
          </div>
        </section>

        {/* ===== Cartão de estado / etapas ===== */}
        <section
          ref={formRef}
          className="rounded-3xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 shadow-card p-4 sm:p-6 space-y-5 scroll-mt-20"
        >
          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5">
            {/* Etapas */}
            <div className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.03] p-5 overflow-x-auto no-scrollbar">
              <ol className="flex min-w-[520px]">
                {etapas.map((e, i) => {
                  const feito = i < indiceActivo;
                  const actual = i === indiceActivo;
                  const Icone = feito ? IconeCheck : e.icone;
                  return (
                    <li key={e.rotulo} className="flex-1 relative">
                      {i < etapas.length - 1 && (
                        <span
                          aria-hidden
                          className={`absolute top-6 left-14 right-2 h-0.5 rounded-full ${
                            feito ? "bg-emerald-500" : actual ? "bg-primary-400" : "bg-neutral-200 dark:bg-white/10"
                          }`}
                        />
                      )}
                      <span
                        className={`relative w-12 h-12 rounded-full grid place-items-center border-2 transition ${
                          feito
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : actual
                              ? "border-primary-400 text-primary-500 dark:text-primary-400 bg-primary-400/10 shadow-[0_0_0_6px_rgba(255,195,0,0.12)]"
                              : "border-neutral-300 dark:border-white/15 text-neutral-400"
                        }`}
                      >
                        <Icone className="w-5 h-5" />
                      </span>
                      <p
                        className={`mt-3 text-sm font-semibold pr-2 ${
                          feito || actual ? "" : "text-neutral-400 dark:text-neutral-500"
                        }`}
                      >
                        {e.rotulo}
                      </p>
                      {activo && <p className="text-xs text-neutral-500 mt-0.5">{feito || actual ? e.hora : "—"}</p>}
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Painel lateral */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="w-14 h-14 shrink-0 rounded-full border-2 border-primary-400 text-primary-500 dark:text-primary-400 grid place-items-center">
                  {activo ? <IconeCamiao className="w-7 h-7" /> : <IconeRaio className="w-7 h-7" />}
                </span>
                <div>
                  <h2 className="font-bold text-lg">
                    {aCarregar
                      ? "A verificar…"
                      : estadoInfo?.titulo ?? (passo === "local" ? "Pronto para pedir" : "Para onde levamos o veículo?")}
                  </h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {estadoInfo?.texto ??
                      (passo === "local"
                        ? "Confirme o local da avaria e continue."
                        : "Indique o destino e o tipo de problema.")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 rounded-2xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.03] divide-x divide-neutral-200 dark:divide-white/10">
                {activo ? (
                  <>
                    <InfoMini
                      icone={<IconeUtilizador className="w-5 h-5" />}
                      rotulo="Motorista"
                      valor={activo.camiao?.motoristaNome ?? activo.empresa?.nome ?? "A atribuir"}
                    />
                    <InfoMini
                      icone={<IconeCarro className="w-5 h-5" />}
                      rotulo="Camião"
                      valor={activo.camiao?.matricula ?? "A atribuir"}
                    />
                  </>
                ) : (
                  <>
                    <InfoMini icone={<IconePin className="w-5 h-5" />} rotulo="Cobertura" valor="Cidade da Matola" />
                    <InfoMini icone={<IconeEtiqueta className="w-5 h-5" />} rotulo="Preço" valor="Faixa antes de pedir" />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Formulário de detalhes */}
          {!activo && passo === "detalhes" && (
            <div className="grid sm:grid-cols-2 gap-4 rj-fade-up">
              <div className="sm:col-span-2 relative">
                <Rotulo>Destino: oficina, casa ou outro</Rotulo>
                {destino ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDestino(null);
                      setBuscaDestino("");
                    }}
                    className="w-full flex items-center gap-3 text-left rounded-xl border border-primary-400/40 bg-primary-400/10 px-4 min-h-[48px] text-sm"
                  >
                    <IconePin className="w-4 h-4 text-primary-500 dark:text-primary-400 shrink-0" />
                    <span className="flex-1 font-semibold truncate">{destino.label}</span>
                    <span className="text-xs text-neutral-500">mudar</span>
                  </button>
                ) : (
                  <>
                    <input
                      value={buscaDestino}
                      onChange={(e) => setBuscaDestino(e.target.value)}
                      placeholder="Ex.: Oficina Auto Geral, Machava"
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
                <select value={tipoProblema} onChange={(e) => setTipoProblema(e.target.value)} className={campo}>
                  {TIPOS_PROBLEMA.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <Rotulo>Tipo de veículo</Rotulo>
                <select value={tipoVeiculo} onChange={(e) => setTipoVeiculo(e.target.value)} className={campo}>
                  {TIPOS_VEICULO.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
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
              <IconePin className="w-5 h-5" /> Continuar <span aria-hidden>→</span>
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
                onClick={verEmpresas}
                disabled={aBuscar || !destino}
                className={`${botaoPrincipal} flex-1`}
              >
                {aBuscar ? "A procurar…" : "Ver empresas disponíveis"} <span aria-hidden>→</span>
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
  "w-full min-h-[48px] px-4 rounded-xl border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30";

const botaoPrincipal =
  "w-full min-h-[52px] inline-flex items-center justify-center gap-2 rounded-full bg-primary-400 text-neutral-950 font-bold hover:bg-primary-300 active:scale-[0.99] transition shadow-[0_8px_24px_-8px_rgba(255,195,0,0.6)] disabled:opacity-50 disabled:pointer-events-none";

function Rotulo({ children }: { children: React.ReactNode }) {
  return <span className="block text-sm font-medium mb-1.5 text-neutral-600 dark:text-neutral-300">{children}</span>;
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
