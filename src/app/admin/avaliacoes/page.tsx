"use client";

import { useEffect, useState } from "react";
import { Botao, Cartao, Etiqueta, Carregando, Vazio } from "@/components/ui";
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

export default function AdminAvaliacoes() {
  const [respostas, setRespostas] = useState<Resposta[] | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/avaliacoes", { cache: "no-store" });
      const d = await res.json();
      setRespostas(d.respostas || []);
    })();
  }, []);

  if (!respostas) return <div className="p-6"><Carregando /></div>;

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

  const mediaExtra1 = mediaPorPergunta(0, "extras");
  const mediaExtra2 = mediaPorPergunta(1, "extras");
  const mediaExtra3 = mediaPorPergunta(2, "extras");

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-extrabold">Avaliações do protótipo</h1>
        <a href="/api/admin/avaliacoes?csv=1">
          <Botao variante="contorno">⬇ Exportar CSV</Botao>
        </a>
      </div>

      {parseados.length === 0 ? (
        <Vazio
          titulo="Sem respostas ainda"
          descricao="As respostas dos condutores e das empresas ao questionário SUS aparecem aqui."
        />
      ) : (
        <>
          {/* SUS médio */}
          <Cartao className="p-5 text-center">
            <p className="text-xs text-neutral-500 uppercase tracking-wide font-bold">
              Pontuação SUS média
            </p>
            <p className="text-5xl font-extrabold text-primary-500 mt-2">{susMedio}</p>
            <p className="text-xs text-neutral-500 mt-1">
              {parseados.length} resposta(s) · escala 0–100
              {susMedio !== null && (
                <> · {susMedio >= 80 ? "Excelente" : susMedio >= 68 ? "Acima da média" : susMedio >= 51 ? "Marginal" : "Fraco"}</>
              )}
            </p>
          </Cartao>

          {/* Perguntas extras */}
          <Cartao className="p-5">
            <h2 className="font-extrabold mb-3">Perguntas do ReboqueJá</h2>
            <div className="space-y-3 text-sm">
              {[
                { q: PERGUNTAS_EXTRAS[0], m: mediaExtra1 },
                { q: PERGUNTAS_EXTRAS[1], m: mediaExtra2 },
                { q: PERGUNTAS_EXTRAS[2], m: mediaExtra3 },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <span className="flex-1">{p.q}</span>
                  <b className="text-primary-600 dark:text-primary-400 shrink-0">
                    {p.m !== null ? p.m.toFixed(1) : "—"} / 5
                  </b>
                </div>
              ))}
            </div>
          </Cartao>

          {/* Médias SUS por pergunta */}
          <Cartao className="p-5">
            <h2 className="font-extrabold mb-3">Média por pergunta SUS</h2>
            <div className="space-y-2 text-sm">
              {PERGUNTAS_SUS.map((q, i) => {
                const m = mediaPorPergunta(i, "sus");
                return (
                  <div key={i} className="flex items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-1.5 last:border-0">
                    <span className="flex-1 text-xs truncate">
                      {i + 1}. {q}
                    </span>
                    <b className="shrink-0">{m !== null ? m.toFixed(1) : "—"}</b>
                  </div>
                );
              })}
            </div>
          </Cartao>

          {/* Respostas individuais */}
          <Cartao className="p-5">
            <h2 className="font-extrabold mb-3">Respostas individuais</h2>
            <div className="space-y-3">
              {parseados.map((r) => (
                <div key={r.id} className="border border-neutral-100 dark:border-neutral-800 rounded-xl p-3 text-sm">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-bold">{r.utilizador.nome}</p>
                    <div className="flex gap-2 items-center">
                      <Etiqueta cor="cinza">{r.papel}</Etiqueta>
                      <Etiqueta cor={r.susScore >= 68 ? "verde" : r.susScore >= 51 ? "amarelo" : "vermelho"}>
                        SUS {r.susScore}
                      </Etiqueta>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">{formatarData(r.criadoEm)}</p>
                  {r.dados.comentario && (
                    <p className="text-xs mt-2 italic">"{r.dados.comentario}"</p>
                  )}
                </div>
              ))}
            </div>
          </Cartao>
        </>
      )}
    </div>
  );
}
