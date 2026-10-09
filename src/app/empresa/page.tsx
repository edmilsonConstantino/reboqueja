"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Botao, Cartao, Etiqueta, Carregando, Vazio } from "@/components/ui";
import { faixaPrecoTexto, formatarDataHora, formatarKm, formatarMinutos } from "@/lib/format";
import { LABEL_ESTADO, LABEL_PROBLEMA, LABEL_VEICULO } from "@/lib/constants-client";

type Painel = {
  empresa: {
    id: string; nome: string; disponivel: boolean; estadoAprovacao: string;
    camioesActivos: number; media: number | null; totalAvaliacoes: number;
  } | null;
  novos: {
    id: string; criadoEm: string; origemEndereco: string; destinoEndereco: string;
    distanciaKm: number; tipoProblema: string; tipoVeiculo: string;
    precoMin: number; precoMax: number; condutorNome: string; veiculo: string | null;
  }[];
  emCurso: {
    id: string; estado: string; origemEndereco: string; destinoEndereco: string;
    condutorNome: string; condutorTelefone: string; camiaoMatricula: string | null;
  }[];
  hoje: { concluidos: number; cancelados: number; ganhoMin: number; ganhoMax: number };
  resumoHoje: {
    receitaMin: number; receitaMax: number; concluidos: number;
    tempoRespostaMin: number | null;
  };
  semana: { dia: string; dataIso: string; concluidos: number; cancelados: number }[];
  camioes: {
    id: string; matricula: string; tipo: string; motoristaNome: string;
    activo: boolean; emServico: boolean;
  }[];
};

const TIPO_CAMIAO_ROTULO: Record<string, string> = LABEL_VEICULO;

export default function PainelEmpresa() {
  const [dados, setDados] = useState<Painel | null>(null);
  const [erroMsg, setErroMsg] = useState("");
  const idsNovosAnteriores = useRef<Set<string>>(new Set());
  const primeira = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/empresa/painel", { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Erro ao carregar o painel.");
        return;
      }
      // Detecta pedidos novos (para som + destaque)
      if (!primeira.current && d.empresa?.disponivel) {
        const idsActuais = new Set((d.novos || []).map((n: { id: string }) => n.id));
        let haNovo = false;
        for (const id of idsActuais as Iterable<string>) {
          if (!idsNovosAnteriores.current.has(String(id))) haNovo = true;
        }
        if (haNovo) {
          try {
            audioRef.current = audioRef.current || new Audio("/novo-pedido.wav");
            audioRef.current.play().catch(() => {});
          } catch {}
        }
      }
      primeira.current = false;
      idsNovosAnteriores.current = new Set((d.novos || []).map((n: { id: string }) => n.id));
      setDados(d);
    } catch {
      setErroMsg("Erro de rede.");
    }
  }, []);

  useEffect(() => {
    carregar();
    const i = setInterval(carregar, 5000);
    return () => clearInterval(i);
  }, [carregar]);

  const alternarDisponibilidade = async () => {
    if (!dados?.empresa) return;
    const novo = !dados.empresa.disponivel;
    setDados({ ...dados, empresa: { ...dados.empresa, disponivel: novo } });
    await fetch("/api/empresa/painel", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disponivel: novo }),
    });
    await carregar();
  };

  if (erroMsg && !dados) return <div className="p-6"><Vazio titulo="Erro" descricao={erroMsg} /></div>;
  if (!dados) return <div className="p-6"><Carregando /></div>;

  if (!dados.empresa) {
    return (
      <div className="p-6">
        <Vazio titulo="Empresa não configurada" descricao="Contacte o administrador." />
      </div>
    );
  }

  const pendente = dados.empresa.estadoAprovacao !== "APROVADA";
  const maxSemana = Math.max(1, ...dados.semana.map((d) => Math.max(d.concluidos, d.cancelados)));

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-neutral-50 dark:bg-neutral-950 dark:bg-[radial-gradient(ellipse_at_top,rgba(255,195,0,0.05),transparent_60%)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* ===== Cabeçalho da empresa ===== */}
      <Cartao className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <span className="w-14 h-14 shrink-0 rounded-2xl bg-primary-400 grid place-items-center text-neutral-950 shadow-card">
              <IconeCamiao className="w-8 h-8" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold truncate">{dados.empresa.nome}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                  ★ {dados.empresa.media ? dados.empresa.media.toFixed(1) : "—"}
                </span>
                <span>· ({dados.empresa.totalAvaliacoes} avaliações)</span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${dados.empresa.disponivel ? "bg-emerald-500" : "bg-neutral-400"}`} />
                  {dados.empresa.disponivel ? "Online" : "Offline"}
                </span>
                <span>· {dados.empresa.camioesActivos} camião(ões) activos</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 hidden sm:block">
                Sempre pronto para o ajudar, onde estiver.
              </p>
            </div>
          </div>

          {/* Interruptor grande */}
          <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.03] px-4 py-3">
            <button
              onClick={alternarDisponibilidade}
              disabled={pendente}
              className={`relative w-16 h-9 rounded-full transition shrink-0 ${dados.empresa.disponivel ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-700"} ${pendente ? "opacity-50" : ""}`}
              aria-label="Alternar disponibilidade"
            >
              <span
                className={`absolute top-1 w-7 h-7 rounded-full bg-white shadow transition-all ${dados.empresa.disponivel ? "left-8" : "left-1"}`}
              />
            </button>
            <div className="leading-tight">
              <p className="font-bold">{dados.empresa.disponivel ? "Online" : "Offline"}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-[180px]">
                {dados.empresa.disponivel
                  ? "A sua empresa está visível e a receber pedidos."
                  : "Não está a receber pedidos neste momento."}
              </p>
            </div>
          </div>
        </div>
      </Cartao>

      {pendente && (
        <Cartao className="p-4 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-900">
          <p className="text-sm">
            A sua empresa ainda não foi <b>aprovada</b> pelo administrador. Enquanto
            isso, não aparece nas pesquisas nem recebe pedidos. Pode já configurar
            camiões e preços.
          </p>
        </Cartao>
      )}

      {/* ===== Números do dia (3 cartões com ícones) ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Cartao className="p-5 flex items-center gap-4">
          <span className="w-12 h-12 shrink-0 rounded-full bg-emerald-500/15 text-emerald-500 grid place-items-center">
            <IconeCheck className="w-6 h-6" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Concluídos hoje</p>
            <p className="text-2xl font-extrabold leading-tight">{dados.hoje.concluidos}</p>
          </div>
          <IconeCalendario className="w-5 h-5 text-neutral-300 dark:text-neutral-600 ml-auto" />
        </Cartao>

        <Cartao className="p-5 flex items-center gap-4">
          <span className="w-12 h-12 shrink-0 rounded-full bg-red-500/15 text-red-500 grid place-items-center">
            <IconeX className="w-6 h-6" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Cancelados hoje</p>
            <p className="text-2xl font-extrabold leading-tight">{dados.hoje.cancelados}</p>
          </div>
          <IconeCirculoX className="w-5 h-5 text-neutral-300 dark:text-neutral-600 ml-auto" />
        </Cartao>

        <Cartao className="p-5 flex items-center gap-4">
          <span className="w-12 h-12 shrink-0 rounded-full bg-primary-400/15 text-primary-600 dark:text-primary-400 grid place-items-center">
            <IconeDinheiro className="w-6 h-6" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Faturação (faixa) hoje</p>
            <p className="text-base sm:text-lg font-extrabold leading-tight text-primary-600 dark:text-primary-400">
              {faixaPrecoTexto(dados.hoje.ganhoMin, dados.hoje.ganhoMax)}
            </p>
          </div>
          <IconeGrafico className="w-5 h-5 text-neutral-300 dark:text-neutral-600 ml-auto" />
        </Cartao>
      </div>

      {/* ===== Grid principal: esquerda (pedidos) / direita (resumo) ===== */}
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5 items-start">

        {/* Coluna esquerda */}
        <div className="space-y-5 min-w-0">
          {/* Pedidos novos */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-extrabold flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-primary-400/15 text-primary-600 dark:text-primary-400 grid place-items-center">
                  <IconeSino className="w-5 h-5" />
                </span>
                Pedidos novos
                {dados.novos.length > 0 && dados.empresa.disponivel && (
                  <span className="w-6 h-6 rounded-full bg-primary-400 text-neutral-950 text-xs font-bold grid place-items-center">
                    {dados.novos.length}
                  </span>
                )}
              </h2>
              <Link href="/empresa/historico" className="text-sm font-semibold text-neutral-500 hover:text-primary-500 dark:hover:text-primary-400 transition">
                Ver todos →
              </Link>
            </div>
            {dados.novos.length === 0 ? (
              <Cartao className="p-4 text-sm text-neutral-500 dark:text-neutral-400">
                Sem pedidos novos neste momento. O painel actualiza a cada 5 segundos.
              </Cartao>
            ) : (
              <div className="space-y-3">
                {dados.novos.map((p) => (
                  <Link key={p.id} href={`/empresa/pedidos/${p.id}`}>
                    <Cartao className="p-5 border-l-4 border-l-primary-400 hover:border-primary-300 transition rj-fade-up">
                      <div className="grid sm:grid-cols-[1.4fr_1fr_auto] gap-4">
                        <div className="space-y-2.5 min-w-0">
                          <div className="flex items-start gap-2.5">
                            <IconePin className="w-4 h-4 text-primary-500 dark:text-primary-400 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate">{p.origemEndereco}</p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                Matola, Moçambique → {p.destinoEndereco}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <IconeChave className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">Problema</p>
                              <p className="text-sm font-medium">{LABEL_PROBLEMA[p.tipoProblema]}{p.tipoProblema === "OUTRO" ? "" : " — não liga"}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <IconeEstrada className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">Distância estimada</p>
                              <p className="text-sm font-medium">{formatarKm(p.distanciaKm)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2.5 min-w-0">
                          <div className="flex items-start gap-2.5">
                            <IconeUtilizador className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">Cliente</p>
                              <p className="text-sm font-medium truncate">{p.condutorNome}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <IconeCalendario className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">Solicitado em</p>
                              <p className="text-sm font-medium">{formatarDataHora(p.criadoEm)}</p>
                            </div>
                          </div>
                          {p.veiculo && (
                            <div className="flex items-start gap-2.5">
                              <IconeCarro className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Veículo</p>
                                <p className="text-sm font-medium truncate">{p.veiculo}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3">
                          <div className="text-right">
                            <span className="inline-block bg-primary-400/15 text-primary-700 dark:text-primary-300 text-sm font-bold px-3 py-1.5 rounded-lg">
                              {faixaPrecoTexto(p.precoMin, p.precoMax)}
                            </span>
                            <p className="text-[11px] text-neutral-400 mt-1">Faixa de preço</p>
                          </div>
                          <span className="text-sm font-bold text-primary-600 dark:text-primary-400 whitespace-nowrap">
                            Ver detalhes →
                          </span>
                        </div>
                      </div>
                    </Cartao>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Serviços em curso */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-extrabold flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-500 grid place-items-center">
                  <IconeBussola className="w-5 h-5" />
                </span>
                Serviços em curso
                {dados.emCurso.length > 0 && (
                  <span className="w-6 h-6 rounded-full bg-primary-400 text-neutral-950 text-xs font-bold grid place-items-center">
                    {dados.emCurso.length}
                  </span>
                )}
              </h2>
              <Link href="/empresa/historico" className="text-sm font-semibold text-neutral-500 hover:text-primary-500 dark:hover:text-primary-400 transition">
                Ver todos →
              </Link>
            </div>
            {dados.emCurso.length === 0 ? (
              <Cartao className="p-4 text-sm text-neutral-500 dark:text-neutral-400">
                Nenhum serviço em curso.
              </Cartao>
            ) : (
              <div className="space-y-3">
                {dados.emCurso.map((p) => (
                  <Link key={p.id} href={`/empresa/pedidos/${p.id}`}>
                    <Cartao className="p-5 hover:border-primary-300 transition">
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-2.5 min-w-0">
                          <div className="flex items-start gap-2.5">
                            <IconePin className="w-4 h-4 text-primary-500 dark:text-primary-400 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate">{p.origemEndereco}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <IconeRelogio className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">Estado</p>
                              <p className="text-sm font-medium">{LABEL_ESTADO[p.estado]}</p>
                            </div>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-start gap-2.5">
                            <IconeCamiao className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">Camião atribuído</p>
                              <p className="text-sm font-medium truncate">{p.camiaoMatricula || "A atribuir"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center sm:justify-end">
                          <Etiqueta cor="azul">{LABEL_ESTADO[p.estado]}</Etiqueta>
                        </div>
                      </div>
                    </Cartao>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Coluna direita */}
        <div className="space-y-5 min-w-0">
          {/* Resumo de hoje */}
          <Cartao className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-primary-400/15 text-primary-600 dark:text-primary-400 grid place-items-center">
                  <IconeGrafico className="w-5 h-5" />
                </span>
                Resumo de hoje
              </h2>
            </div>
            <div className="grid grid-cols-3 divide-x divide-neutral-200 dark:divide-white/10">
              <div className="px-2 first:pl-0 last:pr-0">
                <span className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-500 grid place-items-center mb-2">
                  <IconeDinheiro className="w-5 h-5" />
                </span>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Receita hoje</p>
                <p className="text-sm font-extrabold leading-tight">
                  {faixaPrecoTexto(dados.resumoHoje.receitaMin, dados.resumoHoje.receitaMax)}
                </p>
              </div>
              <div className="px-2 first:pl-0 last:pr-0">
                <span className="w-9 h-9 rounded-lg bg-sky-500/15 text-sky-500 grid place-items-center mb-2">
                  <IconeCheck className="w-5 h-5" />
                </span>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Concluídos</p>
                <p className="text-2xl font-extrabold leading-tight">{dados.resumoHoje.concluidos}</p>
              </div>
              <div className="px-2 first:pl-0 last:pr-0">
                <span className="w-9 h-9 rounded-lg bg-primary-400/15 text-primary-600 dark:text-primary-400 grid place-items-center mb-2">
                  <IconeRelogio className="w-5 h-5" />
                </span>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Tempo médio de resposta</p>
                <p className="text-xl font-extrabold leading-tight">
                  {dados.resumoHoje.tempoRespostaMin !== null
                    ? formatarMinutos(dados.resumoHoje.tempoRespostaMin)
                    : "—"}
                </p>
              </div>
            </div>

            {/* Atividade da semana */}
            <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-sm">Atividade da semana</p>
                <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary-400" /> Concluídos</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /> Cancelados</span>
                </div>
              </div>
              <div className="relative h-32">
                {/* Legenda do eixo Y */}
                {[0, 4, 8].map((v) => (
                  <span key={v} className="absolute left-0 text-[10px] text-neutral-400 -translate-y-1/2" style={{ bottom: `${(v / maxSemana) * 100}%` }}>
                    {v}
                  </span>
                ))}
                <div className="absolute inset-y-0 left-6 right-0 flex items-end justify-between gap-2">
                  {dados.semana.map((d) => (
                    <div key={d.dataIso} className="flex-1 flex items-end justify-center h-full">
                      <div className="w-full max-w-[18px] h-full flex items-end justify-center gap-0.5">
                        <div
                          className="w-1/2 max-w-[8px] rounded-t bg-primary-400 transition-all duration-500"
                          style={{ height: `${(d.concluidos / maxSemana) * 100}%`, minHeight: d.concluidos > 0 ? 4 : 1 }}
                          title={`${d.concluidos} concluídos`}
                        />
                        <div
                          className="w-1/2 max-w-[8px] rounded-t bg-red-400/70 transition-all duration-500"
                          style={{ height: `${(d.cancelados / maxSemana) * 100}%`, minHeight: d.cancelados > 0 ? 4 : 1 }}
                          title={`${d.cancelados} cancelados`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex left-6 relative mt-2">
                <div className="flex-1 ml-6 flex justify-between gap-2">
                  {dados.semana.map((d) => (
                    <span key={d.dataIso} className="flex-1 text-center text-[10px] text-neutral-400">{d.dia}</span>
                  ))}
                </div>
              </div>
            </div>
          </Cartao>

          {/* Estado dos camiões */}
          <Cartao className="p-5">
            <h2 className="font-extrabold flex items-center gap-2.5 mb-1">
              <span className="w-8 h-8 rounded-lg bg-primary-400/15 text-primary-600 dark:text-primary-400 grid place-items-center">
                <IconeCamiao className="w-5 h-5" />
              </span>
              Estado dos camiões
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 ml-[42px]">
              {dados.empresa.camioesActivos} camião(ões) activos
            </p>
            {dados.camioes.length === 0 ? (
              <div className="text-sm text-neutral-500 py-4 text-center">
                Sem camiões registados.{" "}
                <Link href="/empresa/camioes" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                  Adicionar →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-white/[0.06]">
                {dados.camioes.map((c) => (
                  <Link key={c.id} href="/empresa/camioes" className="flex items-center gap-3 py-3 group">
                    <span className="w-10 h-10 shrink-0 rounded-xl bg-primary-400/15 text-primary-600 dark:text-primary-400 grid place-items-center">
                      <IconeCamiao className="w-5 h-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">
                        {TIPO_CAMIAO_ROTULO[c.tipo] || c.tipo} ({c.motoristaNome || "—"})
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        {c.motoristaNome ? `Motorista ${c.motoristaNome} · ` : ""}
                        {c.matricula}
                      </p>
                    </div>
                    <Etiqueta cor={c.emServico ? "azul" : c.activo ? "verde" : "cinza"}>
                      {c.emServico ? "Em serviço" : c.activo ? "Disponível" : "Inactivo"}
                    </Etiqueta>
                    <IconeSeta className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-primary-400 transition" />
                  </Link>
                ))}
              </div>
            )}
          </Cartao>
        </div>
      </div>
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

function IconeCamiao(p: P) {
  return (<svg {...svg} {...p}><path d="M2 16V6h11v10" /><path d="M13 9h4l4 4v3h-8" /><circle cx="7" cy="17.5" r="2" /><circle cx="17" cy="17.5" r="2" /></svg>);
}
function IconeCheck(p: P) {
  return (<svg {...svg} strokeWidth={2.5} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>);
}
function IconeX(p: P) {
  return (<svg {...svg} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>);
}
function IconeCirculoX(p: P) {
  return (<svg {...svg} {...p}><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></svg>);
}
function IconeDinheiro(p: P) {
  return (<svg {...svg} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v10M15 9.5c0-1.4-1.3-2.5-3-2.5s-3 .9-3 2.2c0 3 6 1.6 6 4.6 0 1.3-1.3 2.2-3 2.2s-3-1.1-3-2.5" /></svg>);
}
function IconeGrafico(p: P) {
  return (<svg {...svg} {...p}><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></svg>);
}
function IconeSino(p: P) {
  return (<svg {...svg} {...p}><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 19a2.5 2.5 0 0 0 4 0" /></svg>);
}
function IconePin(p: P) {
  return (<svg {...svg} {...p}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>);
}
function IconeChave(p: P) {
  return (<svg {...svg} {...p}><path d="M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18l3 3 5.7-5.7a4.5 4.5 0 0 0 6-6L14 13l-3-3 3.7-3.7Z" /></svg>);
}
function IconeEstrada(p: P) {
  return (<svg {...svg} {...p}><path d="M4 21 8 3M20 21 16 3M12 4v3M12 11v3M12 18v3" /></svg>);
}
function IconeUtilizador(p: P) {
  return (<svg {...svg} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>);
}
function IconeCalendario(p: P) {
  return (<svg {...svg} {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>);
}
function IconeCarro(p: P) {
  return (<svg {...svg} {...p}><path d="M5 17h14v-4l-2-5H7l-2 5v4Z" /><path d="M5 13h14" /><circle cx="8" cy="17" r="1.5" /><circle cx="16" cy="17" r="1.5" /></svg>);
}
function IconeBussola(p: P) {
  return (<svg {...svg} {...p}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></svg>);
}
function IconeRelogio(p: P) {
  return (<svg {...svg} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
}
function IconeSeta(p: P) {
  return (<svg {...svg} {...p}><path d="m9 6 6 6-6 6" /></svg>);
}
