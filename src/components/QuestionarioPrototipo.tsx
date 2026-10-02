"use client";

import { useEffect, useState } from "react";
import { Botao, Cartao, AvisoErro, Carregando } from "./ui";
import { PERGUNTAS_SUS, PERGUNTAS_EXTRAS } from "@/lib/sus";

export function QuestionarioPrototipo() {
  const [sus, setSus] = useState<number[]>(Array(10).fill(0));
  const [extras, setExtras] = useState<number[]>(Array(3).fill(0));
  const [comentario, setComentario] = useState("");
  const [erroMsg, setErroMsg] = useState("");
  const [resultado, setResultado] = useState<number | null>(null);
  const [aCarregar, setACarregar] = useState(true);
  const [aEnviar, setAEnviar] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/prototipo", { cache: "no-store" });
      const d = await res.json();
      if (res.ok && d.resposta) {
        const dados = JSON.parse(d.resposta.respostas);
        setSus(dados.sus);
        setExtras(dados.extras);
        setComentario(dados.comentario || "");
      }
      setACarregar(false);
    })();
  }, []);

  const tudoPreenchido =
    sus.every((v) => v >= 1) && extras.every((v) => v >= 1);

  const submeter = async () => {
    setAEnviar(true);
    setErroMsg("");
    try {
      const res = await fetch("/api/prototipo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sus, extras, comentario: comentario || null }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Erro ao enviar.");
        return;
      }
      setResultado(d.susScore);
    } finally {
      setAEnviar(false);
    }
  };

  if (aCarregar) return <Carregando />;

  if (resultado !== null) {
    return (
      <Cartao className="p-8 text-center">
        <div className="text-5xl mb-3">🙏</div>
        <h2 className="text-xl font-extrabold mb-2">Obrigado pela sua avaliação!</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          A sua pontuação SUS: <b className="text-primary-600 dark:text-primary-400 text-2xl">{resultado}</b>
          <span className="text-neutral-400"> / 100</span>
        </p>
        <p className="text-xs text-neutral-500 mt-3">
          Pode voltar a esta página para alterar as suas respostas.
        </p>
      </Cartao>
    );
  }

  return (
    <div className="space-y-4">
      <Cartao className="p-4">
        <h2 className="font-bold mb-1">System Usability Scale (SUS)</h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          Para cada frase, indique quanto concorda: 1 = discordo totalmente · 5 = concordo totalmente.
        </p>
        <div className="space-y-5">
          {PERGUNTAS_SUS.map((q, i) => (
            <div key={i}>
              <p className="text-sm mb-2">
                <b>{i + 1}.</b> {q}
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setSus((s) => s.map((x, idx) => (idx === i ? v : x)))}
                    className={`flex-1 min-h-[44px] rounded-xl border-2 text-sm font-bold transition ${
                      sus[i] === v
                        ? "border-primary-400 bg-primary-50 dark:bg-primary-900/30"
                        : "border-neutral-200 dark:border-neutral-700 text-neutral-500"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Cartao>

      <Cartao className="p-4">
        <h2 className="font-bold mb-4">Perguntas sobre o ReboqueJá</h2>
        <div className="space-y-5">
          {PERGUNTAS_EXTRAS.map((q, i) => (
            <div key={i}>
              <p className="text-sm mb-2">{q}</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setExtras((s) => s.map((x, idx) => (idx === i ? v : x)))}
                    className={`flex-1 min-h-[44px] rounded-xl border-2 text-sm font-bold transition ${
                      extras[i] === v
                        ? "border-primary-400 bg-primary-50 dark:bg-primary-900/30"
                        : "border-neutral-200 dark:border-neutral-700 text-neutral-500"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Cartao>

      <Cartao className="p-4">
        <h2 className="font-bold mb-2">Comentário livre</h2>
        <textarea
          className="w-full p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm min-h-[90px]"
          placeholder="O que melhoraria? O que achou confuso?"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />
      </Cartao>

      <AvisoErro>{erroMsg}</AvisoErro>
      {!tudoPreenchido && (
        <p className="text-xs text-neutral-500">Responda a todas as perguntas para enviar.</p>
      )}
      <Botao className="w-full" onClick={submeter} disabled={!tudoPreenchido || aEnviar}>
        {aEnviar ? "A enviar…" : "Enviar avaliação"}
      </Botao>
    </div>
  );
}

/** Banner/convite para responder ao questionário (aparece após pedido concluído). */
export function ConvitePrototipo({ visivel }: { visivel: boolean }) {
  if (!visivel) return null;
  return (
    <div className="bg-primary-400 text-neutral-900 rounded-2xl p-4 flex items-center gap-3 shadow-card">
      <span className="text-2xl">⭐</span>
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-sm">Avalie o protótipo!</p>
        <p className="text-xs opacity-80">
          O seu feedback conta para a nota deste trabalho académico.
        </p>
      </div>
      <a
        href="/app/avaliacao-prototipo"
        className="bg-neutral-900 text-white text-xs font-bold px-3 py-2 rounded-xl shrink-0"
      >
        Responder
      </a>
    </div>
  );
}
