"use client";

import { useEffect, useMemo, useState } from "react";
import { Botao, Carregando } from "@/components/ui";
import { formatarData } from "@/lib/format";
import { PERGUNTAS_SUS, PERGUNTAS_EXTRAS } from "@/lib/sus";

type Resposta = {
  id: string;
  papel: string;
  susScore: number;
  comentario: string | null;
  criadoEm: string;
  respostas: string;
  utilizador: { nome: string; papel: string };
};

type Avaliacao = {
  id: string;
  estrelas: number;
  comentario: string | null;
  pedido: {
    id: string;
    origemEndereco: string;
    destinoEndereco: string;
    criadoEm: string;
    empresa: { id: string; nome: string } | null;
    condutor: { nome: string };
  };
};

type Empresa = { id: string; nome: string };

export default function AdminAvaliacoes() {
  const [respostas, setRespostas] = useState<Resposta[] | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [filtro, setFiltro] = useState("TODAS");
  const [abertas, setAbertas] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/avaliacoes", { cache: "no-store" });
      const d = await res.json();
      setRespostas(d.respostas || []);
      setAvaliacoes(d.avaliacoes || []);
      setEmpresas(d.empresas || []);
    })();
  }, []);

  /** Por empresa: média, total, distribuição 5★→1★ e lista de avaliações. */
  const porEmpresa = useMemo(() => {
    const grupos = empresas.map((e) => ({
      id: e.id,
      nome: e.nome,
      avaliacoes: [] as Avaliacao[],
    }));
    const indice = new Map(grupos.map((g) => [g.id, g]));

    for (const a of avaliacoes) {
      const empresa = a.pedido.empresa;
      if (!empresa) continue;
      const g = indice.get(empresa.id);
      if (g) g.avaliacoes.push(a);
      else {
        const novo = { id: empresa.id, nome: empresa.nome, avaliacoes: [a] };
        grupos.push(novo);
        indice.set(empresa.id, novo);
      }
    }

    return grupos
      .map((g) => {
        const total = g.avaliacoes.length;
        const soma = g.avaliacoes.reduce((s, a) => s + a.estrelas, 0);
        const distribuicao = [5, 4, 3, 2, 1].map((n) => ({
          estrelas: n,
          total: g.avaliacoes.filter((a) => a.estrelas === n).length,
        }));
        return { ...g, total, media: total ? soma / total : null, distribuicao };
      })
      .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
  }, [avaliacoes, empresas]);

  const visiveis =
    filtro === "TODAS" ? porEmpresa : porEmpresa.filter((g) => g.id === filtro);

  if (!respostas) {
    return (
      <div className="p-6">
        <Carregando />
      </div>
    );
  }

  const parseados = respostas.map((r) => ({
    ...r,
    dados: JSON.parse(r.respostas) as { sus: number[]; extras: number[]; comentario?: string },
  }));

  const susMedio =
    parseados.length > 0
      ? Math.round(parseados.reduce((s, r) => s + r.susScore, 0) / parseados.length)
      : null;

  const mediaPorPergunta = (idx: number, tipo: "sus" | "extras") => {
    if (parseados.length === 0) return null;
    const vals = parseados.map((r) => r.dados[tipo][idx]).filter((v) => typeof v === "number");
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const mediaGlobal =
    avaliacoes.length > 0
      ? avaliacoes.reduce((s, a) => s + a.estrelas, 0) / avaliacoes.length
      : null;
  const empresasComAvaliacao = porEmpresa.filter((g) => g.total > 0).length;
  const comComentario = avaliacoes.filter((a) => a.comentario?.trim()).length;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="w-14 h-14 shrink-0 rounded-2xl bg-primary-400/15 text-primary-400 grid place-items-center ring-1 ring-primary-400/25">
            <IconeEstrela className="w-7 h-7" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Avaliações
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Opiniões dos clientes por empresa e respostas ao questionário do protótipo.
            </p>
          </div>
        </div>
        <a href="/api/admin/avaliacoes?csv=1">
          <Botao variante="contorno">⬇ Exportar CSV</Botao>
        </a>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Indicador
          titulo="Média global"
          valor={mediaGlobal !== null ? mediaGlobal.toFixed(1) : "—"}
          detalhe={`${avaliacoes.length} avaliação(ões) de clientes`}
          icone={<IconeEstrela className="w-5 h-5" />}
        />
        <Indicador
          titulo="Empresas avaliadas"
          valor={String(empresasComAvaliacao)}
          detalhe={`de ${porEmpresa.length} empresas`}
          icone={<IconePredio className="w-5 h-5" />}
        />
        <Indicador
          titulo="Com comentário"
          valor={String(comComentario)}
          detalhe="avaliações com texto escrito"
          icone={<IconeBalão className="w-5 h-5" />}
        />
      </div>

      {/* Filtro por empresa */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          Empresa
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="h-10 px-3 rounded-xl bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/10 text-sm text-neutral-800 dark:text-neutral-200 outline-none focus:border-primary-400/60"
          >
            <option value="TODAS">Todas as empresas</option>
            {porEmpresa.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome} ({g.total})
              </option>
            ))}
          </select>
        </label>
        {filtro !== "TODAS" && (
          <button
            onClick={() => setFiltro("TODAS")}
            className="text-xs font-semibold text-primary-400 hover:underline"
          >
            Limpar empresa
          </button>
        )}
      </div>

      {/* Avaliações por empresa */}
      {visiveis.length === 0 ? (
        <Painel className="p-10 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Ainda não há empresas registadas.</p>
        </Painel>
      ) : (
        <div className="space-y-4">
          {visiveis.map((g) => {
            const aberto = Boolean(abertas[g.id]);
            return (
              <Painel key={g.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-bold text-neutral-900 dark:text-white text-lg">{g.nome}</h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {g.total === 0
                        ? "Sem avaliações de clientes"
                        : `${g.total} avaliação(ões) · média ${g.media?.toFixed(1)} de 5`}
                    </p>
                  </div>
                  <div className="text-right">
                    <EstrelasLidas valor={g.media ?? 0} />
                    <p className="text-xs text-neutral-500 mt-1">
                      {g.media !== null ? `${g.media.toFixed(1)} / 5` : "—"}
                    </p>
                  </div>
                </div>

                {g.total > 0 && (
                  <>
                    <div className="mt-4 grid sm:grid-cols-[200px_1fr] gap-4 items-start">
                      <div className="space-y-1.5">
                        {g.distribuicao.map((d) => (
                          <div key={d.estrelas} className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 w-6">
                              {d.estrelas}★
                            </span>
                            <span className="flex-1 h-1.5 rounded-full bg-neutral-100 dark:bg-white/[0.06] overflow-hidden">
                              <span
                                className="block h-full rounded-full bg-primary-400"
                                style={{ width: `${(d.total / g.total) * 100}%` }}
                              />
                            </span>
                            <span className="text-[11px] text-neutral-500 w-5 text-right">
                              {d.total}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex sm:justify-end items-start">
                        <button
                          onClick={() =>
                            setAbertas((a) => ({ ...a, [g.id]: !a[g.id] }))
                          }
                          aria-expanded={aberto}
                          className="h-10 px-4 rounded-xl bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-white/[0.09] transition"
                        >
                          {aberto ? "Fechar comentários ▲" : `Ver comentários (${g.total}) ▼`}
                        </button>
                      </div>
                    </div>

                    {aberto && (
                      <ul className="mt-4 pt-4 border-t border-white/[0.07] space-y-3">
                        {g.avaliacoes.map((a) => (
                          <li
                            key={a.id}
                            className="rounded-xl bg-neutral-100 dark:bg-white/[0.03] border border-white/[0.06] p-3.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                {a.pedido.condutor.nome}
                              </p>
                              <div className="flex items-center gap-3">
                                <span className="text-primary-400 text-sm tracking-tight">
                                  {"★".repeat(a.estrelas)}
                                  <span className="text-neutral-700">
                                    {"★".repeat(5 - a.estrelas)}
                                  </span>
                                </span>
                                <span className="text-[11px] text-neutral-500">
                                  {formatarData(a.pedido.criadoEm)}
                                </span>
                              </div>
                            </div>
                            {a.comentario && (
                              <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1.5 italic">
                                &ldquo;{a.comentario}&rdquo;
                              </p>
                            )}
                            <p className="text-[11px] text-neutral-500 mt-1.5 truncate">
                              {a.pedido.origemEndereco} → {a.pedido.destinoEndereco}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </Painel>
            );
          })}
        </div>
      )}

      {/* ================= Questionário do protótipo ================= */}
      <div className="pt-2">
        <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white">Questionário do protótipo (SUS)</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Respostas dos condutores e das empresas ao questionário de usabilidade.
        </p>
      </div>

      {parseados.length === 0 ? (
        <Painel className="p-10 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Ainda sem respostas ao questionário.</p>
        </Painel>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <Painel className="p-5 text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide font-bold">
              Pontuação SUS média
            </p>
            <p className="text-5xl font-extrabold text-primary-400 mt-2">{susMedio}</p>
            <p className="text-xs text-neutral-500 mt-1">
              {parseados.length} resposta(s) · escala 0–100
              {susMedio !== null && (
                <>
                  {" "}
                  · {susMedio >= 80 ? "Excelente" : susMedio >= 68 ? "Acima da média" : susMedio >= 51 ? "Marginal" : "Fraco"}
                </>
              )}
            </p>
          </Painel>

          <Painel className="p-5">
            <h3 className="font-bold text-neutral-900 dark:text-white mb-3">Perguntas do ReboqueJá</h3>
            <div className="space-y-3 text-sm">
              {[
                { q: PERGUNTAS_EXTRAS[0], m: mediaPorPergunta(0, "extras") },
                { q: PERGUNTAS_EXTRAS[1], m: mediaPorPergunta(1, "extras") },
                { q: PERGUNTAS_EXTRAS[2], m: mediaPorPergunta(2, "extras") },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <span className="flex-1 text-neutral-700 dark:text-neutral-300">{p.q}</span>
                  <b className="text-primary-400 shrink-0">
                    {p.m !== null ? p.m.toFixed(1) : "—"} / 5
                  </b>
                </div>
              ))}
            </div>
          </Painel>

          <Painel className="p-5">
            <h3 className="font-bold text-neutral-900 dark:text-white mb-3">Média por pergunta SUS</h3>
            <div className="space-y-2 text-sm">
              {PERGUNTAS_SUS.map((q, i) => {
                const m = mediaPorPergunta(i, "sus");
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-1.5 last:border-0"
                  >
                    <span className="flex-1 text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {i + 1}. {q}
                    </span>
                    <b className="shrink-0 text-neutral-800 dark:text-neutral-200">
                      {m !== null ? m.toFixed(1) : "—"}
                    </b>
                  </div>
                );
              })}
            </div>
          </Painel>

          <Painel className="p-5">
            <h3 className="font-bold text-neutral-900 dark:text-white mb-3">Respostas individuais</h3>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {parseados.map((r) => (
                <div key={r.id} className="rounded-xl bg-neutral-100 dark:bg-white/[0.03] border border-white/[0.06] p-3 text-sm">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">{r.utilizador.nome}</p>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold ring-1 ring-inset ${
                        r.susScore >= 68
                          ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25"
                          : r.susScore >= 51
                            ? "bg-primary-400/10 text-primary-300 ring-primary-400/25"
                            : "bg-red-400/10 text-red-300 ring-red-400/25"
                      }`}
                    >
                      SUS {r.susScore}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {r.papel} · {formatarData(r.criadoEm)}
                  </p>
                  {r.dados.comentario && (
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-2 italic">
                      &ldquo;{r.dados.comentario}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Painel>
        </div>
      )}
    </div>
  );
}

/* ===== Auxiliares ===== */

function Painel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-gradient-to-b dark:from-white/[0.04] dark:to-white/[0.01] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] ${className}`}
    >
      {children}
    </div>
  );
}

function Indicador({
  titulo,
  valor,
  detalhe,
  icone,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  icone: React.ReactNode;
}) {
  return (
    <Painel className="p-5">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 shrink-0 rounded-xl bg-primary-400/15 text-primary-400 grid place-items-center">
          {icone}
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-extrabold text-neutral-900 dark:text-white leading-none">{valor}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{titulo}</p>
        </div>
      </div>
      <p className="text-[11px] text-neutral-500 mt-3">{detalhe}</p>
    </Painel>
  );
}

/** Estrelas apenas de leitura, com meia estrela arredondada para a mais próxima. */
function EstrelasLidas({ valor }: { valor: number }) {
  const cheias = Math.round(valor);
  return (
    <span className="text-lg tracking-tight" aria-label={`${valor.toFixed(1)} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= cheias ? "text-primary-400" : "text-neutral-700"}>
          ★
        </span>
      ))}
    </span>
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

function IconeEstrela(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="m12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.9 6.4 20l1.3-6.2L3 9.5l6.3-.7L12 3Z" />
    </svg>
  );
}
function IconePredio(props: P) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M9 7h1.5M13.5 7H15M9 11h1.5M13.5 11H15M9 15h1.5M13.5 15H15" />
      <path d="M10.5 21v-3h3v3" />
    </svg>
  );
}
function IconeBalão(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.2-4.2A8 8 0 1 1 21 12Z" />
      <path d="M9 10h6M9 14h4" />
    </svg>
  );
}
