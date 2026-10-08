"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Carregando } from "@/components/ui";
import { LABEL_ESTADO } from "@/lib/constants-client";

type Dashboard = {
  pedidosPorEstado: { estado: string; _count: number }[];
  mediaAvaliacoes: number | null;
  totalAvaliacoes: number;
  tempoMedioRespostaMin: number | null;
  tempoMedioChegadaMin: number | null;
  pedidosPorBairro: { bairro: string; total: number }[];
  variacoes: {
    pedidos: number | null;
    avaliacao: number | null;
    resposta: number | null;
    chegada: number | null;
  };
  series: {
    pedidosPorDia: { dia: string; total: number }[];
    avaliacoesPorDia: { dia: string; valor: number }[];
    respostaPorDia: { dia: string; valor: number }[];
    chegadaPorDia: { dia: string; valor: number }[];
  };
  ultimosPedidos: {
    id: string;
    estado: string;
    criadoEm: string;
    cliente: string;
    bairro: string;
  }[];
};

const COR_ESTADO: Record<string, string> = {
  PENDENTE: "bg-primary-400/15 text-primary-300 ring-primary-400/30",
  ACEITE: "bg-indigo-400/15 text-indigo-300 ring-indigo-400/30",
  A_CAMINHO: "bg-sky-400/15 text-sky-300 ring-sky-400/30",
  NO_LOCAL: "bg-sky-400/15 text-sky-300 ring-sky-400/30",
  EM_TRANSPORTE: "bg-cyan-400/15 text-cyan-300 ring-cyan-400/30",
  CONCLUIDO: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
  CANCELADO: "bg-red-400/15 text-red-300 ring-red-400/30",
};

const COR_ARCO: Record<string, string> = {
  CONCLUIDO: "#10b981",
  A_CAMINHO: "#FFC300",
  CANCELADO: "#ef4444",
  NO_LOCAL: "#38bdf8",
  ACEITE: "#818cf8",
  EM_TRANSPORTE: "#22d3ee",
  PENDENTE: "#94a3b8",
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

  if (erroMsg) return <div className="p-8 text-red-400">{erroMsg}</div>;
  if (!dados) return <div className="p-8"><Carregando /></div>;

  const porEstado = (estado: string) =>
    dados.pedidosPorEstado.find((e) => e.estado === estado)?._count || 0;
  const totalPedidos = dados.pedidosPorEstado.reduce((s, e) => s + e._count, 0);

  const formatarMin = (m: number | null) =>
    m === null ? "—" : m < 1 ? "<1 min" : `${Math.round(m)} min`;

  const hoje = new Date();
  const dataHoje = hoje.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const estadosDonut = Object.entries(COR_ARCO)
    .map(([estado, cor]) => ({ estado, cor, total: porEstado(estado) }))
    .filter((e) => e.total > 0);

  const maxBairro = Math.max(1, ...dados.pedidosPorBairro.map((x) => x.total));

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Olá, Administrador!
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 mt-1.5">
            Aqui está um resumo do que está a acontecer na sua plataforma.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <IconeCalendario className="w-6 h-6 text-primary-400" />
          <div className="leading-tight">
            <p className="text-sm font-bold text-white first-letter:uppercase">{dataHoje}</p>
            <p className="text-xs text-neutral-400">
              {hoje.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          icone={<IconePessoas className="w-6 h-6" />}
          gradiente="from-primary-300 to-primary-600"
          valor={String(totalPedidos)}
          titulo="Pedidos no total"
          variacao={dados.variacoes.pedidos}
          sufixoVariacao="%"
          serie={dados.series.pedidosPorDia.map((p) => p.total)}
          corLinha="#FFC300"
        />
        <KpiCard
          icone={<IconeEstrela className="w-6 h-6" />}
          gradiente="from-amber-300 to-amber-600"
          valor={dados.mediaAvaliacoes ? dados.mediaAvaliacoes.toFixed(1) : "—"}
          titulo="Avaliação média"
          variacao={dados.variacoes.avaliacao}
          sufixoVariacao=""
          serie={dados.series.avaliacoesPorDia.map((a) => a.valor)}
          corLinha="#fbbf24"
        />
        <KpiCard
          icone={<IconeRelogio className="w-6 h-6" />}
          gradiente="from-sky-400 to-blue-700"
          valor={formatarMin(dados.tempoMedioRespostaMin)}
          titulo="Tempo médio de resposta"
          variacao={dados.variacoes.resposta}
          sufixoVariacao="%"
          serie={dados.series.respostaPorDia.map((r) => r.valor)}
          corLinha="#3b82f6"
          menorMelhor
        />
        <KpiCard
          icone={<IconeRaio className="w-6 h-6" />}
          gradiente="from-violet-400 to-purple-700"
          valor={formatarMin(dados.tempoMedioChegadaMin)}
          titulo="Tempo médio de chegada"
          variacao={dados.variacoes.chegada}
          sufixoVariacao="%"
          serie={dados.series.chegadaPorDia.map((c) => c.valor)}
          corLinha="#a855f7"
          menorMelhor
        />
      </div>

      {/* Donut + bairros */}
      <div className="grid lg:grid-cols-2 gap-5">
        <CartaoEscuro>
          <CabecalhoCartao
            icone={<IconeCaixa className="w-5 h-5" />}
            titulo="Pedidos por estado"
            href="/admin/pedidos"
          />
          {totalPedidos === 0 ? (
            <p className="text-sm text-neutral-500 py-10 text-center">Sem pedidos ainda.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-8 pt-2">
              <Donut fatias={estadosDonut.map((e) => ({ cor: e.cor, valor: e.total }))} total={totalPedidos} />
              <div className="flex-1 min-w-[220px] divide-y divide-white/[0.06]">
                {estadosDonut.map((e) => (
                  <div key={e.estado} className="flex items-center gap-3 py-2.5 text-sm">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 ring-4 ring-white/[0.03]"
                      style={{ background: e.cor }}
                    />
                    <span className="text-neutral-300 flex-1">{LABEL_ESTADO[e.estado] || e.estado}</span>
                    <b className="text-white w-8 text-right">{e.total}</b>
                    <span className="text-neutral-500 text-xs w-10 text-right">
                      {Math.round((e.total / totalPedidos) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CartaoEscuro>

        <CartaoEscuro>
          <CabecalhoCartao
            icone={<IconePin className="w-5 h-5" />}
            titulo="Pedidos por bairro"
            extra={`${dados.pedidosPorBairro.length} bairros`}
            href="/admin/pedidos"
          />
          <div className="space-y-3.5 pt-1">
            {dados.pedidosPorBairro.slice(0, 6).map((b) => (
              <div key={b.bairro} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-1.5">
                <span className="text-sm text-neutral-200 font-medium">{b.bairro}</span>
                <b className="row-span-2 text-sm text-white text-right w-6">{b.total}</b>
                <span className="row-span-2 text-xs text-neutral-500 text-right w-9">
                  {totalPedidos > 0 && `${Math.round((b.total / totalPedidos) * 100)}%`}
                </span>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-300 transition-all duration-700"
                    style={{ width: `${(b.total / maxBairro) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {dados.pedidosPorBairro.length === 0 && (
              <p className="text-sm text-neutral-500 py-6 text-center">Sem dados ainda.</p>
            )}
          </div>
        </CartaoEscuro>
      </div>

      {/* Últimos pedidos + crescimento */}
      <div className="grid xl:grid-cols-3 gap-5">
        <CartaoEscuro className="xl:col-span-2">
          <CabecalhoCartao
            icone={<IconeRelogio className="w-5 h-5" />}
            titulo="Últimos pedidos"
            href="/admin/pedidos"
          />
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[620px]">
              <thead>
                <tr className="text-left text-xs text-neutral-500 border-b border-white/[0.08]">
                  <th className="pb-3 pr-3 font-medium">ID</th>
                  <th className="pb-3 pr-3 font-medium">Cliente</th>
                  <th className="pb-3 pr-3 font-medium">Bairro</th>
                  <th className="pb-3 pr-3 font-medium">Estado</th>
                  <th className="pb-3 pr-3 font-medium">Data</th>
                  <th className="pb-3 font-medium text-right">Acções</th>
                </tr>
              </thead>
              <tbody>
                {dados.ultimosPedidos.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] transition"
                  >
                    <td className="py-3 pr-3 font-mono text-xs text-neutral-400">
                      #{p.id.slice(-5).toUpperCase()}
                    </td>
                    <td className="py-3 pr-3 text-neutral-100 font-medium">{p.cliente}</td>
                    <td className="py-3 pr-3 text-neutral-400">{p.bairro}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold ring-1 ring-inset ${
                          COR_ESTADO[p.estado] || "bg-white/5 text-neutral-300 ring-white/10"
                        }`}
                      >
                        {LABEL_ESTADO[p.estado] || p.estado}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-neutral-400 text-xs whitespace-nowrap">
                      {new Date(p.criadoEm).toLocaleDateString("pt-PT")}{" "}
                      {new Date(p.criadoEm).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href="/admin/pedidos"
                        title="Ver pedido"
                        className="inline-grid place-items-center w-8 h-8 rounded-lg text-neutral-400 hover:text-primary-400 hover:bg-white/[0.06] transition"
                      >
                        <IconeOlho className="w-[18px] h-[18px]" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dados.ultimosPedidos.length === 0 && (
              <p className="text-sm text-neutral-500 py-6 text-center">Sem pedidos ainda.</p>
            )}
          </div>
        </CartaoEscuro>

        {/* Cartão de crescimento */}
        <div className="relative overflow-hidden rounded-2xl border border-primary-400/20 bg-gradient-to-br from-primary-400/20 via-neutral-900 to-neutral-950 p-6 flex flex-col justify-end min-h-[300px]">
          <div aria-hidden className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-primary-400/10 blur-3xl" />
          <IlustracaoCrescimento className="relative mx-auto w-44 h-32 mb-4" />
          <h2 className="relative font-bold text-lg text-white">O seu negócio está a crescer!</h2>
          <p className="relative text-sm text-neutral-300 mt-1.5 leading-relaxed">
            {dados.tempoMedioRespostaMin !== null
              ? `Com um tempo médio de resposta de ${formatarMin(dados.tempoMedioRespostaMin)}, está a oferecer uma excelente experiência aos seus utilizadores.`
              : "Registe pedidos para começar a acompanhar o crescimento da plataforma."}
          </p>
          <Link
            href="/admin/avaliacoes"
            className="relative mt-5 self-start inline-flex items-center gap-2 bg-primary-400 text-neutral-950 px-5 py-2.5 rounded-full font-bold text-sm hover:bg-primary-300 transition shadow-[0_4px_14px_-4px_rgba(255,195,0,0.6)]"
          >
            Ver relatório completo <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ===== Componentes auxiliares ===== */

function CartaoEscuro({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] ${className}`}
    >
      {children}
    </div>
  );
}

function CabecalhoCartao({
  icone,
  titulo,
  href,
  extra,
}: {
  icone: React.ReactNode;
  titulo: string;
  href?: string;
  extra?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-white/[0.06]">
      <h2 className="flex items-center gap-2.5 font-bold text-white">
        <span className="w-8 h-8 rounded-lg bg-primary-400/15 text-primary-400 grid place-items-center">
          {icone}
        </span>
        {titulo}
      </h2>
      <div className="flex items-center gap-3">
        {extra && <span className="text-xs text-neutral-500">{extra}</span>}
        {href && (
          <Link
            href={href}
            className="text-xs font-semibold text-neutral-400 hover:text-primary-400 inline-flex items-center gap-1 transition"
          >
            Ver todos <span aria-hidden>→</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  icone,
  gradiente,
  valor,
  titulo,
  variacao,
  sufixoVariacao,
  serie,
  corLinha,
  menorMelhor = false,
}: {
  icone: React.ReactNode;
  gradiente: string;
  valor: string;
  titulo: string;
  variacao: number | null;
  sufixoVariacao: string;
  serie: number[];
  corLinha: string;
  menorMelhor?: boolean;
}) {
  const desceu = variacao !== null && variacao < 0;
  const bom = variacao === null ? true : menorMelhor ? variacao <= 0 : variacao >= 0;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-5 transition hover:border-white/20 hover:-translate-y-0.5">
      <div
        aria-hidden
        className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-2xl opacity-20"
        style={{ background: corLinha }}
      />
      <div className="relative flex items-center gap-4">
        <span
          className={`w-14 h-14 shrink-0 rounded-full bg-gradient-to-br ${gradiente} grid place-items-center text-white shadow-lg ring-4 ring-white/[0.04]`}
        >
          {icone}
        </span>
        <div className="min-w-0">
          <p className="text-3xl font-extrabold text-white leading-none tracking-tight">{valor}</p>
          <p className="text-sm text-neutral-400 mt-1.5 truncate">{titulo}</p>
        </div>
      </div>
      <div className="relative mt-4 flex items-end justify-between gap-2">
        <div className="text-xs">
          {variacao !== null ? (
            <>
              <p className={`font-bold ${bom ? "text-emerald-400" : "text-red-400"}`}>
                {desceu ? "↓" : "↑"} {variacao > 0 ? "+" : variacao < 0 ? "−" : ""}
                {Math.abs(variacao).toFixed(1)}
                {sufixoVariacao}
              </p>
              <p className="text-neutral-500 mt-0.5">em relação ao mês anterior</p>
            </>
          ) : (
            <p className="text-neutral-500">Sem dados do mês anterior</p>
          )}
        </div>
        <Sparkline valores={serie} cor={corLinha} />
      </div>
    </div>
  );
}

/** Sparkline com área em gradiente (SVG puro). */
function Sparkline({ valores, cor }: { valores: number[]; cor: string }) {
  const id = useId().replace(/:/g, "");
  const W = 96;
  const H = 40;
  if (valores.length < 2 || valores.every((v) => v === 0)) {
    return (
      <svg width={W} height={H} aria-hidden className="opacity-30 shrink-0">
        <line x1="0" y1={H - 4} x2={W} y2={H - 4} stroke={cor} strokeWidth="2" strokeLinecap="round" strokeDasharray="3 4" />
      </svg>
    );
  }
  const max = Math.max(...valores);
  const min = Math.min(...valores);
  const intervalo = max - min || 1;
  const pts = valores.map((v, i) => [
    (i / (valores.length - 1)) * W,
    H - 4 - ((v - min) / intervalo) * (H - 10),
  ]);
  // Curva suave
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  const area = `${d} L${W},${H} L0,${H} Z`;
  const [ux, uy] = pts[pts.length - 1];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden className="shrink-0 overflow-visible">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.45" />
          <stop offset="100%" stopColor={cor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g${id})`} />
      <path d={d} fill="none" stroke={cor} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={ux} cy={uy} r="3" fill={cor} stroke="#0a0a0a" strokeWidth="1.5" />
    </svg>
  );
}

/** Donut com arcos SVG. */
function Donut({ fatias, total }: { fatias: { cor: string; valor: number }[]; total: number }) {
  const raio = 62;
  const circ = 2 * Math.PI * raio;
  let acumulado = 0;
  return (
    <div className="relative w-[180px] h-[180px] shrink-0 mx-auto">
      <div aria-hidden className="absolute inset-6 rounded-full bg-emerald-500/10 blur-2xl" />
      <svg viewBox="0 0 160 160" className="relative w-full h-full -rotate-90">
        <circle cx="80" cy="80" r={raio} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="20" />
        {fatias.map((f, i) => {
          const dash = (f.valor / total) * circ;
          const el = (
            <circle
              key={i}
              cx="80"
              cy="80"
              r={raio}
              fill="none"
              stroke={f.cor}
              strokeWidth="20"
              strokeDasharray={`${Math.max(0, dash - 2)} ${circ - Math.max(0, dash - 2)}`}
              strokeDashoffset={-acumulado}
            />
          );
          acumulado += dash;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-xs text-neutral-400">Total</p>
          <p className="text-3xl font-extrabold text-white leading-tight">{total}</p>
          <p className="text-xs text-neutral-500">pedidos</p>
        </div>
      </div>
    </div>
  );
}

function IlustracaoCrescimento(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 180 130" fill="none" aria-hidden {...props}>
      <ellipse cx="90" cy="120" rx="70" ry="6" fill="rgba(255,195,0,0.12)" />
      <rect x="40" y="82" width="20" height="36" rx="3" fill="#CA9A04" />
      <rect x="68" y="64" width="20" height="54" rx="3" fill="#EAB308" />
      <rect x="96" y="44" width="20" height="74" rx="3" fill="#FFC300" />
      <rect x="124" y="54" width="20" height="64" rx="3" fill="rgba(255,255,255,0.15)" />
      <path d="M38 70 L72 50 L96 58 L130 24" stroke="#FFD65C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M116 22 L132 22 L132 38" stroke="#FFD65C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="146" y="6" width="26" height="26" rx="6" fill="#FFC300" />
      <path d="m159 12 2.2 4.6 5 .6-3.7 3.4 1 5-4.5-2.5-4.5 2.5 1-5-3.7-3.4 5-.6Z" fill="#121212" />
    </svg>
  );
}

/* ===== Ícones ===== */

type P = React.SVGProps<SVGSVGElement>;
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconePessoas(props: P) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c1.2-3.2 3.6-5 6.5-5s5.3 1.8 6.5 5" />
      <path d="M16 5a3.5 3.5 0 0 1 0 7" />
      <path d="M18.5 15.5c1.6.8 2.7 2.3 3.3 4.5" />
    </svg>
  );
}
function IconeEstrela(props: P) {
  return (
    <svg {...base} fill="currentColor" {...props}>
      <path d="m12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.9 6.4 20l1.3-6.2L3 9.5l6.3-.7L12 3Z" />
    </svg>
  );
}
function IconeRelogio(props: P) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function IconeRaio(props: P) {
  return (
    <svg {...base} fill="currentColor" {...props}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  );
}
function IconeCaixa(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M21 8.5v7L12 21l-9-5.5v-7L12 3l9 5.5Z" />
      <path d="M3.3 8.6 12 13.5l8.7-4.9" />
      <path d="M12 13.5V21" />
    </svg>
  );
}
function IconePin(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}
function IconeOlho(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconeCalendario(props: P) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
