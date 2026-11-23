"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Carregando } from "@/components/ui";
import { formatarData, formatarTelefone } from "@/lib/format";

type Utilizador = {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  papel: string;
  activo: boolean;
  criadoEm: string;
  _count: { pedidos: number };
  empresa: { id: string; nome: string } | null;
  empresaCondutor?: { id: string; nome: string } | null;
  camiao: { matricula: string; empresa: { id: string; nome: string } } | null;
};

const ROTULO_PAPEL: Record<string, string> = {
  CLIENTE: "Cliente",
  CONDUTOR: "Condutor",
  EMPRESA: "Empresa",
  ADMIN: "Administrador",
};

const COR_PAPEL: Record<string, string> = {
  CLIENTE: "bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-500/25 dark:ring-sky-400/25",
  CONDUTOR: "bg-amber-500/15 text-amber-800 dark:text-primary-300 ring-amber-500/30 dark:ring-primary-400/25",
  EMPRESA: "bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-violet-500/25 dark:ring-violet-400/25",
  ADMIN: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/25 dark:ring-emerald-400/25",
};

const POR_PAGINA = 8;

export default function AdminUtilizadores() {
  const [utilizadores, setUtilizadores] = useState<Utilizador[] | null>(null);
  const [erroMsg, setErroMsg] = useState("");
  const [aProcessar, setAProcessar] = useState<string | null>(null);
  const [termo, setTermo] = useState("");
  const [papel, setPapel] = useState("TODOS");
  const [estado, setEstado] = useState<"TODOS" | "ACTIVOS" | "INACTIVOS">("TODOS");
  const [empresaFiltro, setEmpresaFiltro] = useState("TODAS");
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);

  const carregar = useCallback(async () => {
    const res = await fetch("/api/admin/utilizadores", { cache: "no-store" });
    const d = await res.json();
    if (res.ok) setUtilizadores(d.utilizadores || []);
    else setErroMsg(d.erro || "Erro ao carregar utilizadores.");
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const alternar = async (u: Utilizador) => {
    setAProcessar(u.id);
    setErroMsg("");
    try {
      const res = await fetch("/api/admin/utilizadores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id, activo: !u.activo }),
      });
      if (!res.ok) {
        const d = await res.json();
        setErroMsg(d.erro || "Erro ao actualizar.");
        return;
      }
      await carregar();
    } finally {
      setAProcessar(null);
    }
  };

  const empresas = useMemo(
    () =>
      (utilizadores ?? [])
        .filter((u) => u.papel === "EMPRESA" && u.empresa)
        .map((u) => u.empresa!)
        .sort((a, b) => a.nome.localeCompare(b.nome)),
    [utilizadores]
  );

  const porEmpresa = useMemo(
    () =>
      empresaFiltro === "TODAS"
        ? utilizadores ?? []
        : (utilizadores ?? []).filter(
            (u) =>
              u.empresa?.id === empresaFiltro ||
              u.empresaCondutor?.id === empresaFiltro ||
              u.camiao?.empresa?.id === empresaFiltro
          ),
    [utilizadores, empresaFiltro]
  );

  const porEstado = useMemo(
    () =>
      estado === "TODOS"
        ? porEmpresa
        : porEmpresa.filter((u) => (estado === "ACTIVOS" ? u.activo : !u.activo)),
    [porEmpresa, estado]
  );

  const visiveis = useMemo(() => {
    const t = termo.trim().toLowerCase();
    return t
      ? porEstado.filter((u) =>
          [u.nome, u.telefone, u.email ?? "", u.camiao?.matricula ?? ""]
            .some((v) => v.toLowerCase().includes(t))
        )
      : porEstado;
  }, [porEstado, termo]);

  const filtrados = papel === "TODOS" ? visiveis : visiveis.filter((u) => u.papel === papel);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const daPagina = filtrados.slice(inicio, inicio + POR_PAGINA);

  const mudarFiltro = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPagina(1);
  };

  if (!utilizadores) {
    return (
      <div className="p-6">
        <Carregando />
      </div>
    );
  }

  const empresaDe = (u: Utilizador) =>
    u.papel === "EMPRESA"
      ? u.empresa?.nome
      : u.papel === "CONDUTOR"
        ? u.camiao?.empresa?.nome ?? u.empresaCondutor?.nome
        : undefined;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="w-14 h-14 shrink-0 rounded-2xl bg-primary-400/15 text-primary-400 grid place-items-center ring-1 ring-primary-400/25">
            <IconePessoas className="w-7 h-7" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Utilizadores
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Gerir as contas da plataforma de forma simples e eficiente.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-white/[0.03] px-4 py-2.5">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Total</span>
          <b className="text-lg font-extrabold text-neutral-900 dark:text-white leading-none">
            {utilizadores.length}
          </b>
          <span className="text-xs text-neutral-500">contas</span>
        </div>
      </div>

      {erroMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erroMsg}
        </div>
      )}

      {/* Painel */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0E1629] shadow-sm dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]">
        {/* Barra de filtros */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/[0.07] space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <IconeLupa className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
              <input
                value={termo}
                onChange={(e) => {
                  setTermo(e.target.value);
                  setPagina(1);
                }}
                placeholder="Pesquisar por nome, telefone, email ou matrícula…"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 outline-none focus:border-amber-500 dark:focus:border-primary-400/60 focus:ring-2 focus:ring-amber-400/20 dark:focus:ring-primary-400/20 transition"
              />
            </div>

            <select
              value={empresaFiltro}
              onChange={(e) => mudarFiltro(setEmpresaFiltro)(e.target.value)}
              aria-label="Filtrar por empresa"
              className="h-11 px-3 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 dark:focus:border-primary-400/60 lg:w-56 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-[#0B1120] dark:[&>option]:text-slate-100"
            >
              <option value="TODAS">Todas as empresas</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>

            <select
              value={papel}
              onChange={(e) => mudarFiltro(setPapel)(e.target.value)}
              aria-label="Filtrar por cargo"
              className="h-11 px-3 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 dark:focus:border-primary-400/60 lg:w-48 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-[#0B1120] dark:[&>option]:text-slate-100"
            >
              <option value="TODOS">Todos os cargos</option>
              {Object.entries(ROTULO_PAPEL).map(([v, r]) => (
                <option key={v} value={v}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { v: "TODOS", r: "Todos" },
                { v: "ACTIVOS", r: "Activos" },
                { v: "INACTIVOS", r: "Inactivos" },
              ] as const
            ).map(({ v, r }) => {
              const total =
                v === "TODOS"
                  ? visiveis.length
                  : visiveis.filter((u) => (v === "ACTIVOS" ? u.activo : !u.activo)).length;
              const activo = estado === v;
              return (
                <button
                  key={v}
                  onClick={() => mudarFiltro(setEstado)(v)}
                  aria-pressed={activo}
                  className={`h-9 px-4 rounded-full text-xs font-bold transition ${
                    activo
                      ? "bg-primary-400 text-neutral-950 shadow-[0_4px_14px_-6px_rgba(255,195,0,0.7)]"
                      : "bg-neutral-100 dark:bg-white/[0.05] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/[0.09] border border-neutral-200 dark:border-white/10"
                  }`}
                >
                  {r} ({total})
                </button>
              );
            })}

            {(termo || papel !== "TODOS" || estado !== "TODOS" || empresaFiltro !== "TODAS") && (
              <button
                onClick={() => {
                  setTermo("");
                  setPapel("TODOS");
                  setEstado("TODOS");
                  setEmpresaFiltro("TODAS");
                  setPagina(1);
                }}
                className="h-9 px-3 rounded-full text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-primary-400 transition"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* Cabeçalho da tabela (desktop) */}
        <div className="hidden md:grid grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_96px] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.07]">
          <span>Utilizador</span>
          <span>Cargo</span>
          <span>Empresa</span>
          <span>Estado</span>
          <span>Registado</span>
          <span className="text-right">Acções</span>
        </div>

        {/* Linhas */}
        <div className="divide-y divide-neutral-200 dark:divide-white/[0.06]">
          {daPagina.length === 0 && (
            <p className="text-sm text-neutral-500 py-12 text-center">
              Nenhum utilizador corresponde a estes filtros.
            </p>
          )}

          {daPagina.map((u) => {
            const empresa = empresaDe(u);
            const aberto = abertoId === u.id;
            return (
              <div key={u.id} className={aberto ? "bg-neutral-50 dark:bg-white/[0.02]" : "hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition"}>
                <div className="grid md:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_96px] gap-x-4 gap-y-2 items-center px-4 sm:px-5 py-3.5">
                  {/* Utilizador */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-10 h-10 shrink-0 rounded-full grid place-items-center text-sm font-extrabold ${
                        u.activo
                          ? "bg-gradient-to-br from-primary-300 to-primary-500 text-neutral-950 ring-2 ring-primary-400/25"
                          : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-500 ring-2 ring-neutral-200 dark:ring-white/10"
                      }`}
                    >
                      {iniciais(u.nome)}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          u.activo ? "text-neutral-900 dark:text-white" : "text-neutral-500 dark:text-neutral-400"
                        }`}
                      >
                        {u.nome}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {u.email ?? formatarTelefone(u.telefone)}
                      </p>
                    </div>
                  </div>

                  {/* Cargo */}
                  <div className="md:block flex items-center gap-2">
                    <span className="md:hidden text-[11px] uppercase tracking-wide text-neutral-500">
                      Cargo
                    </span>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ring-1 ring-inset ${
                        COR_PAPEL[u.papel] ?? "bg-white/5 text-neutral-700 dark:text-neutral-300 ring-neutral-200 dark:ring-white/10"
                      }`}
                    >
                      {ROTULO_PAPEL[u.papel] ?? u.papel}
                    </span>
                  </div>

                  {/* Empresa */}
                  <div className="min-w-0 md:block flex items-center gap-2">
                    <span className="md:hidden text-[11px] uppercase tracking-wide text-neutral-500">
                      Empresa
                    </span>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                      {empresa ?? <span className="text-neutral-600">—</span>}
                    </p>
                  </div>

                  {/* Estado */}
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={`w-2 h-2 rounded-full ${
                        u.activo ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        u.activo ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  {/* Registado */}
                  <p className="text-sm text-slate-500 dark:text-slate-400">{formatarData(u.criadoEm)}</p>

                  {/* Acções */}
                  <div className="flex items-center justify-start md:justify-end gap-1">
                    <button
                      onClick={() => setAbertoId(aberto ? null : u.id)}
                      aria-expanded={aberto}
                      title={aberto ? "Fechar detalhes" : "Ver detalhes"}
                      aria-label={aberto ? "Fechar detalhes" : "Ver detalhes"}
                      className={`w-9 h-9 grid place-items-center rounded-lg transition ${
                        aberto
                          ? "text-amber-700 dark:text-primary-400 bg-amber-500/10 dark:bg-primary-400/10"
                          : "text-slate-500 dark:text-slate-400 hover:text-amber-700 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                      }`}
                    >
                      <IconeOlho className="w-[18px] h-[18px]" />
                    </button>
                    {u.papel !== "ADMIN" && (
                      <button
                        onClick={() => alternar(u)}
                        disabled={aProcessar === u.id}
                        title={u.activo ? "Desactivar conta" : "Activar conta"}
                        aria-label={u.activo ? "Desactivar conta" : "Activar conta"}
                        className={`w-9 h-9 grid place-items-center rounded-lg transition disabled:opacity-40 ${
                          u.activo
                            ? "text-red-600 dark:text-red-400 hover:bg-red-500/10"
                            : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                        }`}
                      >
                        <IconeEnergia className="w-[18px] h-[18px]" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Detalhes */}
                {aberto && (
                  <div className="px-4 sm:px-5 pb-4">
                    <dl className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-xl border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-[#0B1120] p-4 text-sm">
                      <Campo rotulo="Telefone" valor={formatarTelefone(u.telefone)} />
                      <Campo rotulo="Email" valor={u.email ?? "—"} />
                      <Campo rotulo="Empresa" valor={empresa ?? "—"} />
                      <Campo
                        rotulo="Camião"
                        valor={u.camiao ? u.camiao.matricula : "—"}
                      />
                      <Campo
                        rotulo="Pedidos"
                        valor={u.papel === "CLIENTE" ? String(u._count.pedidos) : "—"}
                      />
                      <Campo rotulo="Inscrito em" valor={formatarData(u.criadoEm)} />
                      <Campo
                        rotulo="Estado da conta"
                        valor={u.activo ? "Activa" : "Desactivada"}
                      />
                    </dl>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Rodapé / paginação */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-t border-slate-200 dark:border-white/[0.07]">
          <p className="text-xs text-neutral-500">
            {filtrados.length === 0
              ? "0 utilizadores"
              : `A mostrar ${inicio + 1}–${Math.min(inicio + POR_PAGINA, filtrados.length)} de ${filtrados.length} utilizadores`}
          </p>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                aria-label="Página anterior"
                className="w-8 h-8 grid place-items-center rounded-lg bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/[0.09] disabled:opacity-40 transition"
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
                      : "bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/[0.09]"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                aria-label="Página seguinte"
                className="w-8 h-8 grid place-items-center rounded-lg bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/[0.09] disabled:opacity-40 transition"
              >
                <IconeSeta className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wide text-neutral-500">{rotulo}</dt>
      <dd className="text-sm text-neutral-800 dark:text-neutral-200 mt-0.5 truncate">{valor}</dd>
    </div>
  );
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.charAt(0) ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : "";
  return (primeira + ultima).toUpperCase();
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
function IconeLupa(props: P) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
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
function IconeEnergia(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v9" />
      <path d="M6.4 6.4a8 8 0 1 0 11.2 0" />
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
