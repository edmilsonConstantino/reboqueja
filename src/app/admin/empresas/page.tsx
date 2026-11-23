"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Carregando } from "@/components/ui";
import { formatarData, formatarTelefone } from "@/lib/format";

type Condutor = {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  activo: boolean;
};

type Camiao = {
  id: string;
  matricula: string;
  tipo: string;
  activo: boolean;
  disponivel: boolean;
  localizacaoValida: boolean;
  emServico: boolean;
  motorista: Condutor | null;
};

type Empresa = {
  id: string;
  nome: string;
  nuit: string;
  telefone: string;
  email: string;
  endereco: string;
  raioKm: number;
  disponivel: boolean;
  estadoAprovacao: string;
  consentimentoEm: string | null;
  utilizador: { nome: string; telefone: string; email: string; criadoEm: string };
  camioes: Camiao[];
  _count: { camioes: number; pedidos: number };
};

const POR_PAGINA = 6;

const ESTADO: Record<string, { rotulo: string; classe: string; ponto: string }> = {
  APROVADA: {
    rotulo: "Activa",
    classe: "bg-emerald-400/10 text-emerald-600 dark:text-emerald-300 ring-emerald-500/25",
    ponto: "bg-emerald-500",
  },
  PENDENTE: {
    rotulo: "Pendente",
    classe: "bg-primary-400/10 text-primary-700 dark:text-primary-300 ring-primary-400/30",
    ponto: "bg-primary-400",
  },
  REJEITADA: {
    rotulo: "Suspensa",
    classe: "bg-red-400/10 text-red-600 dark:text-red-300 ring-red-500/25",
    ponto: "bg-red-500",
  },
};

export default function AdminEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[] | null>(null);
  const [erroMsg, setErroMsg] = useState("");
  const [aProcessar, setAProcessar] = useState<string | null>(null);
  const [termo, setTermo] = useState("");
  const [filtro, setFiltro] = useState("TODAS");
  const [cidade, setCidade] = useState("TODAS");
  const [abertas, setAbertas] = useState<Record<string, boolean>>({});
  const [pagina, setPagina] = useState(1);

  const carregar = useCallback(async () => {
    const res = await fetch("/api/admin/empresas", { cache: "no-store" });
    const d = await res.json();
    if (res.ok) setEmpresas(d.empresas);
    else setErroMsg(d.erro || "Erro ao carregar.");
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const decidir = async (id: string, decisao: "APROVADA" | "REJEITADA") => {
    setAProcessar(id);
    setErroMsg("");
    try {
      const res = await fetch("/api/admin/empresas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decisao }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Erro ao processar.");
        return;
      }
      await carregar();
    } finally {
      setAProcessar(null);
    }
  };

  const cidades = useMemo(() => {
    const lista = new Set<string>();
    for (const e of empresas ?? []) {
      const cidadeDa = e.endereco.split(",").pop()?.trim();
      if (cidadeDa) lista.add(cidadeDa);
    }
    return Array.from(lista).sort((a, b) => a.localeCompare(b));
  }, [empresas]);

  const filtradas = useMemo(() => {
    const t = termo.trim().toLowerCase();
    return (empresas ?? []).filter((e) => {
      const cidadeDa = e.endereco.split(",").pop()?.trim() ?? "";
      if (filtro !== "TODAS" && e.estadoAprovacao !== filtro) return false;
      if (cidade !== "TODAS" && cidadeDa !== cidade) return false;
      if (!t) return true;
      return [e.nome, e.nuit, e.endereco, e.email, e.telefone].some((v) =>
        v.toLowerCase().includes(t)
      );
    });
  }, [empresas, filtro, cidade, termo]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const daPagina = filtradas.slice(inicio, inicio + POR_PAGINA);

  if (!empresas) {
    return (
      <div className="p-6">
        <Carregando />
      </div>
    );
  }

  const contar = (estado: string) => empresas.filter((e) => e.estadoAprovacao === estado).length;
  const temFiltros = termo !== "" || filtro !== "TODAS" || cidade !== "TODAS";

  const condutoresDa = (e: Empresa) =>
    e.camioes
      .filter((c): c is Camiao & { motorista: Condutor } => Boolean(c.motorista))
      .map((c) => ({
        ...c.motorista,
        matricula: c.matricula,
        emServico: c.emServico,
        disponivel: c.disponivel,
        localizacaoValida: c.localizacaoValida,
        camiaoActivo: c.activo,
      }));

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start gap-4">
        <span className="w-14 h-14 shrink-0 rounded-2xl bg-primary-400/15 text-primary-600 dark:text-primary-400 grid place-items-center ring-1 ring-primary-400/25">
          <IconePredio className="w-7 h-7" />
        </span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Empresas</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Gerir as empresas de reboque registadas na plataforma.
          </p>
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Indicador
          icone={<IconePredio className="w-5 h-5" />}
          cor="text-primary-600 dark:text-primary-400"
          fundo="bg-primary-400/15"
          valor={empresas.length}
          titulo="Total de empresas"
        />
        <Indicador
          icone={<IconeEscudo className="w-5 h-5" />}
          cor="text-emerald-600 dark:text-emerald-400"
          fundo="bg-emerald-500/15"
          valor={contar("APROVADA")}
          titulo="Empresas activas"
        />
        <Indicador
          icone={<IconeRelogio className="w-5 h-5" />}
          cor="text-orange-600 dark:text-orange-400"
          fundo="bg-orange-500/15"
          valor={contar("PENDENTE")}
          titulo="Empresas pendentes"
        />
        <Indicador
          icone={<IconeBloqueado className="w-5 h-5" />}
          cor="text-red-600 dark:text-red-400"
          fundo="bg-red-500/15"
          valor={contar("REJEITADA")}
          titulo="Empresas suspensas"
        />
      </div>

      {erroMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {erroMsg}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <IconeLupa className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral-400 pointer-events-none" />
          <input
            value={termo}
            onChange={(e) => {
              setTermo(e.target.value);
              setPagina(1);
            }}
            placeholder="Pesquisar por nome, NUIT ou localização…"
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-white dark:bg-[#0E1629] border border-slate-200 dark:border-white/10 text-sm outline-none focus:border-amber-500 dark:focus:border-primary-400/60 focus:ring-2 focus:ring-amber-400/20 dark:focus:ring-primary-400/20 transition"
          />
        </div>

        <select
          value={filtro}
          onChange={(e) => {
            setFiltro(e.target.value);
            setPagina(1);
          }}
          aria-label="Filtrar por estado"
          className="h-11 px-3 rounded-xl bg-white dark:bg-[#0E1629] border border-slate-200 dark:border-white/10 text-sm outline-none focus:border-amber-500 dark:focus:border-primary-400/60 lg:w-52 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-[#0B1120] dark:[&>option]:text-slate-100"
        >
          <option value="TODAS">Todos os estados</option>
          <option value="APROVADA">Activas</option>
          <option value="PENDENTE">Pendentes</option>
          <option value="REJEITADA">Suspensas</option>
        </select>

        <select
          value={cidade}
          onChange={(e) => {
            setCidade(e.target.value);
            setPagina(1);
          }}
          aria-label="Filtrar por cidade"
          className="h-11 px-3 rounded-xl bg-white dark:bg-[#0E1629] border border-slate-200 dark:border-white/10 text-sm outline-none focus:border-amber-500 dark:focus:border-primary-400/60 lg:w-48 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-[#0B1120] dark:[&>option]:text-slate-100"
        >
          <option value="TODAS">Todas as cidades</option>
          {cidades.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {temFiltros && (
          <button
            onClick={() => {
              setTermo("");
              setFiltro("TODAS");
              setCidade("TODAS");
              setPagina(1);
            }}
            className="h-11 px-4 rounded-xl border border-neutral-200 dark:border-white/10 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition inline-flex items-center justify-center gap-2"
          >
            <IconeLimpar className="w-4 h-4" /> Limpar filtros
          </button>
        )}
      </div>

      {/* Lista */}
      {daPagina.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0E1629] p-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nenhuma empresa corresponde a estes filtros.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {daPagina.map((e) => {
            const estado = ESTADO[e.estadoAprovacao] ?? ESTADO.PENDENTE;
            const aberto = Boolean(abertas[e.id]);
            const condutores = condutoresDa(e);
            return (
              <div
                key={e.id}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0E1629] shadow-sm dark:shadow-[0_8px_30px_-16px_rgba(0,0,0,0.5)] transition hover:border-slate-300 dark:hover:border-white/20"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 sm:p-5">
                  {/* Identidade */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <span className="w-16 h-16 shrink-0 rounded-xl bg-gradient-to-br from-primary-300/25 to-primary-500/10 ring-1 ring-primary-400/30 grid place-items-center text-primary-700 dark:text-primary-300 font-extrabold text-lg">
                      {iniciais(e.nome)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-base truncate">{e.nome}</h2>
                        {e.estadoAprovacao === "APROVADA" && (
                          <IconeVerificado className="w-4 h-4 text-sky-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        NUIT {e.nuit} · {e.endereco} · raio {e.raioKm} km
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="inline-flex items-center gap-1.5">
                          <IconeTelefone className="w-3.5 h-3.5 shrink-0" />
                          {formatarTelefone(e.telefone)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 min-w-0">
                          <IconeEmail className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{e.email}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <IconeCamiao className="w-3.5 h-3.5 shrink-0" />
                          {e._count.camioes} camiões · {condutores.length} condutores
                        </span>
                      </p>
                      <p className="text-xs mt-1.5">
                        {e.consentimentoEm ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                            <IconeCheck className="w-3.5 h-3.5" />
                            Consentimento dado em {formatarData(e.consentimentoEm)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-red-500">
                            <IconeX className="w-3.5 h-3.5" />
                            Sem consentimento de publicação
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Estado + registo + acções */}
                  <div className="flex items-center lg:flex-col lg:items-end gap-4 lg:gap-2 shrink-0">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ring-1 ring-inset ${estado.classe}`}
                      >
                        <span aria-hidden className={`w-1.5 h-1.5 rounded-full ${estado.ponto}`} />
                        {estado.rotulo}
                      </span>
                      <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                        <IconeCalendario className="w-3.5 h-3.5" />
                        Registada em {formatarData(e.utilizador.criadoEm)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto lg:ml-0">
                      <BotaoAccao
                        rotulo={aberto ? "Fechar detalhes" : "Ver detalhes"}
                        onClick={() => setAbertas((a) => ({ ...a, [e.id]: !a[e.id] }))}
                        activo={aberto}
                      >
                        <IconeOlho className="w-[18px] h-[18px]" />
                      </BotaoAccao>

                      {e.estadoAprovacao !== "APROVADA" ? (
                        <BotaoAccao
                          rotulo="Aprovar empresa"
                          variante="verde"
                          onClick={() => decidir(e.id, "APROVADA")}
                          disabled={aProcessar === e.id || !e.consentimentoEm}
                        >
                          <IconeCheck className="w-[18px] h-[18px]" />
                        </BotaoAccao>
                      ) : (
                        <BotaoAccao
                          rotulo="Revogar aprovação"
                          variante="vermelha"
                          onClick={() => decidir(e.id, "REJEITADA")}
                          disabled={aProcessar === e.id}
                        >
                          <IconeEscudo className="w-[18px] h-[18px]" />
                        </BotaoAccao>
                      )}

                      {e.estadoAprovacao === "PENDENTE" && (
                        <BotaoAccao
                          rotulo="Rejeitar empresa"
                          variante="vermelha"
                          onClick={() => decidir(e.id, "REJEITADA")}
                          disabled={aProcessar === e.id}
                        >
                          <IconeX className="w-[18px] h-[18px]" />
                        </BotaoAccao>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detalhes */}
                {aberto && (
                  <div className="px-4 sm:px-5 pb-5 border-t border-neutral-200 dark:border-white/[0.07] pt-4 space-y-4">
                    <dl className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <Campo rotulo="Conta de acesso" valor={e.utilizador.nome} />
                      <Campo rotulo="Telefone da conta" valor={formatarTelefone(e.utilizador.telefone)} />
                      <Campo rotulo="Email da conta" valor={e.utilizador.email} />
                      <Campo rotulo="Pedidos recebidos" valor={String(e._count.pedidos)} />
                    </dl>

                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
                        Condutores desta empresa ({condutores.length})
                      </h3>
                      {condutores.length === 0 ? (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Nenhum camião desta empresa tem condutor atribuído.
                        </p>
                      ) : (
                        <ul className="grid sm:grid-cols-2 gap-2">
                          {condutores.map((c) => {
                            const statusTexto = c.emServico
                              ? "Em serviço"
                              : !c.activo || !c.camiaoActivo
                                ? "Inactivo"
                                : c.disponivel && c.localizacaoValida
                                  ? "Disponível"
                                  : c.disponivel
                                    ? "GPS expirado"
                                    : "Indisponível";
                            const statusCor = c.emServico
                              ? "text-sky-600 dark:text-sky-400"
                              : !c.activo || !c.camiaoActivo
                                ? "text-red-500"
                                : c.disponivel && c.localizacaoValida
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : c.disponivel
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-neutral-500 dark:text-neutral-400";
                            const pontoCor = c.emServico
                              ? "bg-sky-500"
                              : !c.activo || !c.camiaoActivo
                                ? "bg-red-500"
                                : c.disponivel && c.localizacaoValida
                                  ? "bg-emerald-500"
                                  : c.disponivel
                                    ? "bg-amber-500"
                                    : "bg-neutral-400";
                            return (
                              <li
                                key={c.id}
                                className="rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.03] px-3 py-2.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold truncate">{c.nome}</p>
                                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${statusCor}`}>
                                    <span aria-hidden className={`w-1.5 h-1.5 rounded-full ${pontoCor}`} />
                                    {statusTexto}
                                  </span>
                                </div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                  {formatarTelefone(c.telefone)} · matrícula {c.matricula}
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rodapé */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {filtradas.length === 0
            ? "0 empresas"
            : `Mostrando ${inicio + 1}–${Math.min(inicio + POR_PAGINA, filtradas.length)} de ${filtradas.length} empresas`}
        </p>
        {totalPaginas > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              aria-label="Página anterior"
              className="w-8 h-8 grid place-items-center rounded-lg bg-white dark:bg-white/[0.05] border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.09] disabled:opacity-40 transition"
            >
              <IconeSeta className="w-4 h-4 rotate-90" />
            </button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPagina(n)}
                aria-current={n === paginaActual ? "page" : undefined}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                  n === paginaActual
                    ? "bg-primary-400 text-neutral-950"
                    : "bg-white dark:bg-white/[0.05] border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.09]"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas}
              aria-label="Página seguinte"
              className="w-8 h-8 grid place-items-center rounded-lg bg-white dark:bg-white/[0.05] border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.09] disabled:opacity-40 transition"
            >
              <IconeSeta className="w-4 h-4 -rotate-90" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== Auxiliares ===== */

function Indicador({
  icone,
  valor,
  titulo,
  cor,
  fundo,
}: {
  icone: React.ReactNode;
  valor: number;
  titulo: string;
  cor: string;
  fundo: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0E1629] p-4 shadow-sm dark:shadow-none">
      <div className="flex items-center gap-3">
        <span className={`w-11 h-11 shrink-0 rounded-xl grid place-items-center ${fundo} ${cor}`}>
          {icone}
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {titulo}
          </p>
          <p className="text-2xl font-extrabold leading-tight tabular-nums">{valor}</p>
        </div>
      </div>
    </div>
  );
}

function BotaoAccao({
  children,
  rotulo,
  variante = "neutra",
  activo = false,
  ...props
}: {
  children: React.ReactNode;
  rotulo: string;
  variante?: "neutra" | "verde" | "vermelha";
  activo?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cores =
    variante === "verde"
      ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
      : variante === "vermelha"
        ? "text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10"
        : activo
          ? "text-primary-600 dark:text-primary-400 border-primary-400/50 bg-primary-400/10"
          : "text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/[0.06]";
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      className={`w-10 h-10 grid place-items-center rounded-full border transition disabled:opacity-40 disabled:pointer-events-none ${cores}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {rotulo}
      </dt>
      <dd className="text-sm font-semibold mt-0.5 truncate">{valor}</dd>
    </div>
  );
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
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

function IconePredio(props: P) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M9 7h1.5M13.5 7H15M9 11h1.5M13.5 11H15M9 15h1.5M13.5 15H15" />
      <path d="M10.5 21v-3h3v3" />
    </svg>
  );
}
function IconeEscudo(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
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
function IconeBloqueado(props: P) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
function IconeLupa(props: P) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function IconeLimpar(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M20 11a8 8 0 1 0-2.4 5.7" />
      <path d="M20 5v6h-6" />
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
function IconeCheck(props: P) {
  return (
    <svg {...base} strokeWidth={2.6} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}
function IconeX(props: P) {
  return (
    <svg {...base} strokeWidth={2.4} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
function IconeTelefone(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L16 12l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 5.2 2 2 0 0 1 6.5 3Z" />
    </svg>
  );
}
function IconeEmail(props: P) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  );
}
function IconeCamiao(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M2 16V6h11v10" />
      <path d="M13 9h4l4 4v3h-8" />
      <circle cx="7" cy="17.5" r="2" />
      <circle cx="17" cy="17.5" r="2" />
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
function IconeVerificado(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.2l2.2 1.7 2.8-.2 1 2.6 2.4 1.4-.8 2.7.8 2.7-2.4 1.4-1 2.6-2.8-.2L12 21.8l-2.2-1.7-2.8.2-1-2.6L3.6 15l.8-2.7-.8-2.7L6 8.2l1-2.6 2.8.2L12 2.2Z" />
      <path d="m8.5 12 2.4 2.4 4.6-4.7" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconeSeta(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
