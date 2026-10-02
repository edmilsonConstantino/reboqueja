"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Botao, Cartao, AvisoErro, Carregando, Estrelas, Vazio } from "@/components/ui";
import { METODOS_PAGAMENTO } from "@/lib/constants";
import { faixaPrecoTexto } from "@/lib/format";

type Pedido = {
  estado: string;
  empresa: { nome: string } | null;
  precoMin: number;
  precoMax: number;
  distanciaKm: number;
  avaliacao: { estrelas: number } | null;
};

export default function ConcluirPedido() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [metodo, setMetodo] = useState("MPESA");
  const [estrelas, setEstrelas] = useState(5);
  const [comentario, setComentario] = useState("");
  const [erroMsg, setErroMsg] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [aEnviar, setAEnviar] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/pedidos/${id}`, { cache: "no-store" });
      const d = await res.json();
      if (res.ok) setPedido(d.pedido);
      else setErroMsg(d.erro || "Erro ao carregar o pedido.");
    })();
  }, [id]);

  const submeter = async () => {
    setAEnviar(true);
    setErroMsg("");
    try {
      const res = await fetch(`/api/pedidos/${id}/concluir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metodoPagamento: metodo,
          estrelas,
          comentario: comentario || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Não foi possível concluir.");
        return;
      }
      setSucesso(d.mensagem);
      setTimeout(() => router.push("/app/historico"), 1800);
    } finally {
      setAEnviar(false);
    }
  };

  if (!pedido) {
    return erroMsg ? (
      <div className="p-6"><Vazio titulo="Pedido indisponível" descricao={erroMsg} /></div>
    ) : (
      <div className="p-6"><Carregando /></div>
    );
  }

  if (pedido.estado !== "CONCLUIDO") {
    return (
      <div className="max-w-md mx-auto p-6">
        <Vazio
          titulo="O serviço ainda não terminou"
          descricao={`Estado actual: ${pedido.estado}. A avaliação fica disponível quando a empresa marcar o serviço como concluído.`}
          accao={<Botao onClick={() => router.push(`/app/pedido/${id}`)}>Ver acompanhamento</Botao>}
        />
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-xl font-extrabold mb-2">Obrigado!</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{sucesso}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-24 space-y-4">
      <h1 className="text-2xl font-extrabold">Serviço concluído 🏁</h1>
      <Cartao className="p-4 text-sm">
        <p className="font-bold">{pedido.empresa?.nome}</p>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Distância: {pedido.distanciaKm.toFixed(1)} km · Faixa:{" "}
          <b className="text-primary-600 dark:text-primary-400">
            {faixaPrecoTexto(pedido.precoMin, pedido.precoMax)}
          </b>
        </p>
      </Cartao>

      {/* Pagamento */}
      <Cartao className="p-4">
        <h2 className="font-bold mb-3">Método de pagamento</h2>
        <div className="grid grid-cols-3 gap-2">
          {METODOS_PAGAMENTO.map((m) => (
            <button
              key={m.value}
              onClick={() => setMetodo(m.value)}
              className={`min-h-[64px] rounded-xl border-2 text-sm font-semibold transition ${
                metodo === m.value
                  ? "border-primary-400 bg-primary-50 dark:bg-primary-900/20"
                  : "border-neutral-200 dark:border-neutral-700"
              }`}
            >
              {m.value === "DINHEIRO" ? "💵" : m.value === "MPESA" ? "📱" : "📲"}{" "}
              <br />
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-neutral-500 mt-3">
          O pagamento é acordado diretamente com a empresa, que confirma o
          recebimento na aplicação. (Protótipo — sem pagamento real.)
        </p>
      </Cartao>

      {/* Avaliação */}
      <Cartao className="p-4">
        <h2 className="font-bold mb-1 text-center">Avalie o serviço</h2>
        <p className="text-xs text-neutral-500 text-center mb-3">
          A sua opinião ajuda outras pessoas a escolher.
        </p>
        <Estrelas valor={estrelas} aoMudar={setEstrelas} />
        <textarea
          className="w-full mt-4 p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm min-h-[80px]"
          placeholder="Comentário (opcional): pontualidade, cuidado com o veículo…"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />
      </Cartao>

      <AvisoErro>{erroMsg}</AvisoErro>
      <div className="fixed bottom-0 inset-x-0 p-4 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-md mx-auto">
          <Botao className="w-full" onClick={submeter} disabled={aEnviar}>
            {aEnviar ? "A enviar…" : "Confirmar pagamento e avaliar"}
          </Botao>
        </div>
      </div>
    </div>
  );
}
