"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Botao, Cartao, Etiqueta, Carregando, Vazio } from "@/components/ui";
import { faixaPrecoTexto, formatarDataHora, formatarKm } from "@/lib/format";
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
};

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Cabeçalho com toggle */}
      <Cartao className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold truncate">{dados.empresa.nome}</h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              ★ {dados.empresa.media ? dados.empresa.media.toFixed(1) : "—"} ({dados.empresa.totalAvaliacoes}) ·{" "}
              {dados.empresa.camioesActivos} camião(ões) activos
            </p>
          </div>
          {/* Interruptor grande */}
          <button
            onClick={alternarDisponibilidade}
            disabled={pendente}
            className={`relative w-20 h-11 rounded-full transition shrink-0 ${dados.empresa.disponivel ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-700"} ${pendente ? "opacity-50" : ""}`}
            aria-label="Alternar disponibilidade"
          >
            <span
              className={`absolute top-1 w-9 h-9 rounded-full bg-white shadow transition-all ${dados.empresa.disponivel ? "left-10" : "left-1"}`}
            />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Etiqueta cor={dados.empresa.disponivel ? "verde" : "cinza"}>
            {dados.empresa.disponivel ? "DISPONÍVEL — a receber pedidos" : "INDISPONÍVEL"}
          </Etiqueta>
          {pendente && <Etiqueta cor="amarelo">Aguarda aprovação do administrador</Etiqueta>}
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

      {/* Números do dia */}
      <div className="grid grid-cols-3 gap-3">
        <Cartao className="p-3 text-center">
          <p className="text-2xl font-extrabold">{dados.hoje.concluidos}</p>
          <p className="text-xs text-neutral-500">concluídos hoje</p>
        </Cartao>
        <Cartao className="p-3 text-center">
          <p className="text-2xl font-extrabold text-red-500">{dados.hoje.cancelados}</p>
          <p className="text-xs text-neutral-500">cancelados</p>
        </Cartao>
        <Cartao className="p-3 text-center">
          <p className="text-sm font-extrabold text-primary-600 dark:text-primary-400 mt-1">
            {faixaPrecoTexto(dados.hoje.ganhoMin, dados.hoje.ganhoMax)}
          </p>
          <p className="text-xs text-neutral-500">em faixas hoje</p>
        </Cartao>
      </div>

      {/* Pedidos novos */}
      <section>
        <h2 className="font-extrabold mb-3 flex items-center gap-2">
          🔔 Pedidos novos
          {dados.novos.length > 0 && dados.empresa.disponivel && (
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          )}
        </h2>
        {dados.novos.length === 0 ? (
          <Cartao className="p-4 text-sm text-neutral-500 dark:text-neutral-400">
            Sem pedidos novos neste momento. O painel actualiza a cada 5 segundos.
          </Cartao>
        ) : (
          <div className="space-y-3">
            {dados.novos.map((p) => (
              <Link key={p.id} href={`/empresa/pedidos/${p.id}`}>
                <Cartao className="p-4 border-l-4 border-l-primary-400 hover:border-primary-300 transition rj-fade-up">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{p.origemEndereco}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        → {p.destinoEndereco}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {LABEL_PROBLEMA[p.tipoProblema]} · {LABEL_VEICULO[p.tipoVeiculo]} ·{" "}
                        {formatarKm(p.distanciaKm)}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {p.condutorNome}
                        {p.veiculo ? ` · ${p.veiculo}` : ""} · {formatarDataHora(p.criadoEm)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-primary-600 dark:text-primary-400 text-sm">
                        {faixaPrecoTexto(p.precoMin, p.precoMax)}
                      </p>
                      <span className="text-xs text-neutral-400">ver detalhes →</span>
                    </div>
                  </div>
                </Cartao>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Em curso */}
      <section>
        <h2 className="font-extrabold mb-3">🚚 Serviços em curso</h2>
        {dados.emCurso.length === 0 ? (
          <Cartao className="p-4 text-sm text-neutral-500 dark:text-neutral-400">
            Nenhum serviço em curso.
          </Cartao>
        ) : (
          <div className="space-y-3">
            {dados.emCurso.map((p) => (
              <Link key={p.id} href={`/empresa/pedidos/${p.id}`}>
                <Cartao className="p-4 hover:border-primary-300 transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{p.origemEndereco}</p>
                      <p className="text-xs text-neutral-500 truncate">
                        {p.condutorNome} · {p.camiaoMatricula || "sem camião"}
                      </p>
                    </div>
                    <Etiqueta cor="azul">{LABEL_ESTADO[p.estado]}</Etiqueta>
                  </div>
                </Cartao>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
