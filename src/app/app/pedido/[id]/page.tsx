"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mapa } from "@/components/Mapa";
import { Botao, Cartao, Etiqueta, Carregando, Vazio } from "@/components/ui";
import { faixaPrecoTexto, formatarDataHora, formatarKm, formatarTelefone, formatarMinutos } from "@/lib/format";
import { LABEL_ESTADO, LABEL_PROBLEMA, LABEL_VEICULO, ORDEM_ESTADOS, ICONES_ESTADO, LABEL_PAGAMENTO } from "@/lib/constants-client";
import { VELOCIDADE_MEDIA_KMH } from "@/lib/constants";
import type { LatLng } from "@/lib/geo";

type Pedido = {
  id: string;
  estado: string;
  origemLat: number; origemLng: number; origemEndereco: string;
  destinoLat: number; destinoLng: number; destinoEndereco: string;
  distanciaKm: number;
  tipoProblema: string;
  tipoVeiculo: string;
  observacoes: string | null;
  precoMin: number;
  precoMax: number;
  metodoPagamento: string | null;
  pagamentoConfirmado: boolean;
  criadoEm: string;
  canceladoPor: string | null;
  condutor: { nome: string; telefone: string };
  veiculo: { marca: string; modelo: string; matricula: string } | null;
  empresa: {
    id: string; nome: string; telefone: string; endereco: string;
    lat: number; lng: number;
  } | null;
  camiao: {
    matricula: string; tipo: string; motoristaNome: string;
    motoristaTelefone: string; lat: number; lng: number;
  } | null;
  eventos: { id: string; estado: string; nota: string | null; criadoEm: string }[];
  avaliacao: { estrelas: number; comentario: string | null } | null;
};

export default function AcompanharPedido() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [expirado, setExpirado] = useState(false);
  const [erroMsg, setErroMsg] = useState("");
  const [aCancelar, setACancelar] = useState(false);
  const [confirmarCancelamento, setConfirmarCancelamento] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch(`/api/pedidos/${id}`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Erro ao carregar o pedido.");
        return;
      }
      setPedido(d.pedido);
      setExpirado(d.expirado);
    } catch {
      setErroMsg("Erro de rede.");
    }
  }, [id]);

  // Polling de 5s
  useEffect(() => {
    carregar();
    const i = setInterval(carregar, 5000);
    return () => clearInterval(i);
  }, [carregar]);

  const cancelar = async () => {
    setACancelar(true);
    try {
      const res = await fetch(`/api/pedidos/${id}`, { method: "DELETE" });
      if (res.ok) await carregar();
    } finally {
      setACancelar(false);
      setConfirmarCancelamento(false);
    }
  };

  if (erroMsg && !pedido) {
    return (
      <div className="p-6">
        <Vazio
          titulo="Pedido não encontrado"
          descricao={erroMsg}
          accao={<Botao onClick={() => router.push("/app/historico")}>Ver histórico</Botao>}
        />
      </div>
    );
  }

  if (!pedido) {
    return <div className="p-6"><Carregando texto="A carregar o pedido…" /></div>;
  }

  const origem: LatLng = { lat: pedido.origemLat, lng: pedido.origemLng };
  const destino: LatLng = { lat: pedido.destinoLat, lng: pedido.destinoLng };
  const camiao: LatLng | null = pedido.camiao ? { lat: pedido.camiao.lat, lng: pedido.camiao.lng } : null;
  const emCurso = ["PENDENTE", "ACEITE", "A_CAMINHO", "NO_LOCAL", "EM_TRANSPORTE"].includes(pedido.estado);
  const etaMin = camiao ? (distanciaHaversineKm(camiao, origem) / VELOCIDADE_MEDIA_KMH) * 60 : null;

  const marcadores = [
    { id: "o", pos: origem, emoji: "🚗", cor: "#FFC300", pulso: pedido.estado === "PENDENTE" },
    { id: "d", pos: destino, emoji: "🏁", cor: "#10B981" },
    ...(camiao
      ? [{ id: "c", pos: camiao, emoji: "🚚", cor: "#0EA5E9", pulso: pedido.estado === "A_CAMINHO" }]
      : []),
  ];

  return (
    <div className="fixed inset-0 pt-14 pb-[300px]">
      <Mapa
        centro={camiao && pedido.estado === "A_CAMINHO" ? camiao : origem}
        zoom={13}
        marcadores={marcadores}
        linha={camiao && pedido.estado === "A_CAMINHO" ? [camiao, origem] : pedido.estado === "EM_TRANSPORTE" ? [origem, destino] : null}
        encaixarEm
        className="absolute inset-0"
      />

      <div className="absolute z-30 inset-x-0 bottom-0 max-h-[56vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-t-3xl shadow-sheet p-4 space-y-4">
        {/* Estado principal */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold">
              {pedido.estado === "PENDENTE"
                ? expirado
                  ? "Ninguém aceitou ainda…"
                  : "A procurar empresa…"
                : LABEL_ESTADO[pedido.estado]}
            </h1>
            {pedido.estado === "PENDENTE" && !expirado && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                As empresas estão a ver o seu pedido. Isto costuma levar menos de 3 minutos.
              </p>
            )}
            {pedido.estado === "A_CAMINHO" && etaMin !== null && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                O camião chega em ~{formatarMinutos(etaMin)}.
              </p>
            )}
          </div>
          <Etiqueta cor={pedido.estado === "CONCLUIDO" ? "verde" : pedido.estado === "CANCELADO" ? "vermelho" : "amarelo"}>
            {LABEL_ESTADO[pedido.estado]}
          </Etiqueta>
        </div>

        {/* Radar quando pendente */}
        {pedido.estado === "PENDENTE" && (
          <div className="relative h-16 flex items-center justify-center overflow-hidden">
            <div className="absolute w-16 h-16 rounded-full bg-primary-400/25 rj-radar" />
            <div className="absolute w-16 h-16 rounded-full bg-primary-400/20 rj-radar" style={{ animationDelay: "0.6s" }} />
            <span className="text-3xl relative">🛻</span>
          </div>
        )}

        {/* Expirado: escolher outra empresa ou cancelar */}
        {pedido.estado === "PENDENTE" && expirado && (
          <Cartao className="p-4 border-primary-200 dark:border-primary-900">
            <p className="text-sm font-semibold mb-3">
              O pedido passou de 3 minutos sem resposta. O que pretende?
            </p>
            <div className="flex gap-2">
              <Botao
                className="flex-1"
                onClick={() => {
                  // Novo pedido com os mesmos dados: pode escolher outra empresa
                  sessionStorage.setItem(
                    "rj-rascunho",
                    JSON.stringify({
                      origemLat: pedido.origemLat, origemLng: pedido.origemLng,
                      origemEndereco: pedido.origemEndereco,
                      destinoLat: pedido.destinoLat, destinoLng: pedido.destinoLng,
                      destinoEndereco: pedido.destinoEndereco,
                      tipoProblema: pedido.tipoProblema, tipoVeiculo: pedido.tipoVeiculo,
                      observacoes: pedido.observacoes,
                    })
                  );
                  fetch(`/api/pedidos/${id}`, { method: "DELETE" }).then(() =>
                    router.push("/app/pedido/novo")
                  );
                }}
              >
                Tentar de novo
              </Botao>
              <Botao variante="contorno" className="flex-1" onClick={() => setConfirmarCancelamento(true)}>
                Cancelar
              </Botao>
            </div>
          </Cartao>
        )}

        {/* Cartão da empresa */}
        {pedido.empresa && pedido.camiao && (
          <Cartao className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{pedido.empresa.nome}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Motorista: {pedido.camiao.motoristaNome} · {formatarTelefone(pedido.camiao.motoristaTelefone)}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Camião: {pedido.camiao.matricula} ({LABEL_VEICULO[pedido.camiao.tipo] || pedido.camiao.tipo})
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <a
                  href={`tel:${pedido.camiao.motoristaTelefone}`}
                  className="w-11 h-11 grid place-items-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-xl"
                  aria-label="Ligar"
                >
                  📞
                </a>
                <a
                  href={`https://wa.me/258${pedido.camiao.motoristaTelefone.replace(/\D/g, "").slice(3)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-11 h-11 grid place-items-center rounded-xl bg-primary-100 dark:bg-primary-900/40 text-xl"
                  aria-label="WhatsApp"
                >
                  💬
                </a>
              </div>
            </div>
          </Cartao>
        )}

        {/* Linha do tempo */}
        <Cartao className="p-4">
          <h2 className="text-sm font-bold mb-3">Linha do tempo</h2>
          <div className="relative rj-timeline pl-0">
            {ORDEM_ESTADOS.map((estado) => {
              const ev = pedido.eventos.find((e) => e.estado === estado);
              const idx = ORDEM_ESTADOS.indexOf(estado);
              const idxActual = ORDEM_ESTADOS.indexOf(pedido.estado);
              const feito = ev || (pedido.estado === "CANCELADO" && idx < idxActual);
              const cancelado = pedido.estado === "CANCELADO" && idx > ORDEM_ESTADOS.indexOf("PENDENTE");
              if (cancelado && !ev) return null;
              return (
                <div key={estado} className="flex items-start gap-3 py-2 relative">
                  <div
                    className={`w-8 h-8 rounded-full grid place-items-center text-sm shrink-0 relative z-10 ${
                      feito
                        ? "bg-primary-400 text-neutral-900"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {ICONES_ESTADO[estado]}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${feito ? "" : "text-neutral-400"}`}>
                      {LABEL_ESTADO[estado]}
                    </p>
                    {ev && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {formatarDataHora(ev.criadoEm)}
                        {ev.nota ? ` · ${ev.nota}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {pedido.estado === "CANCELADO" && (
              <div className="flex items-start gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 grid place-items-center text-sm z-10">
                  ❌
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-600">Cancelado</p>
                  <p className="text-xs text-neutral-500">
                    {formatarDataHora(pedido.eventos.find((e) => e.estado === "CANCELADO")?.criadoEm || pedido.criadoEm)}
                    {pedido.canceladoPor ? ` · por ${pedido.canceladoPor.toLowerCase()}` : ""}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Cartao>

        {/* Detalhes */}
        <Cartao className="p-4 text-sm space-y-1.5">
          <p><span className="text-neutral-500">Problema:</span> {LABEL_PROBLEMA[pedido.tipoProblema]} · {LABEL_VEICULO[pedido.tipoVeiculo]}</p>
          <p><span className="text-neutral-500">De:</span> {pedido.origemEndereco}</p>
          <p><span className="text-neutral-500">Para:</span> {pedido.destinoEndereco}</p>
          <p><span className="text-neutral-500">Distância:</span> {formatarKm(pedido.distanciaKm)}</p>
          <p>
            <span className="text-neutral-500">Faixa de preço:</span>{" "}
            <b className="text-primary-600 dark:text-primary-400">
              {faixaPrecoTexto(pedido.precoMin, pedido.precoMax)}
            </b>
          </p>
          {pedido.observacoes && <p><span className="text-neutral-500">Obs.:</span> {pedido.observacoes}</p>}
          {pedido.metodoPagamento && (
            <p>
              <span className="text-neutral-500">Pagamento:</span>{" "}
              {LABEL_PAGAMENTO[pedido.metodoPagamento]}
              {pedido.pagamentoConfirmado ? " · confirmado pela empresa ✅" : " · a confirmar"}
            </p>
          )}
        </Cartao>

        {/* Acções */}
        <div className="flex gap-2 pb-2">
          {pedido.estado === "CONCLUIDO" && !pedido.avaliacao && (
            <Botao className="flex-1" onClick={() => router.push(`/app/pedido/${id}/concluir`)}>
              💰 Pagamento & ⭐ Avaliação
            </Botao>
          )}
          {pedido.estado === "CONCLUIDO" && pedido.avaliacao && (
            <Cartao className="p-4 flex-1 text-sm">
              Avaliou com <b>{"★".repeat(pedido.avaliacao.estrelas)}</b>
              {pedido.avaliacao.comentario ? ` — "${pedido.avaliacao.comentario}"` : ""}
            </Cartao>
          )}
          {emCurso && pedido.estado !== "PENDENTE" && (
            <Botao variante="contorno" onClick={() => setConfirmarCancelamento(true)} disabled={aCancelar}>
              Cancelar pedido
            </Botao>
          )}
          {pedido.estado === "PENDENTE" && !expirado && (
            <Botao variante="contorno" onClick={() => setConfirmarCancelamento(true)}>
              Cancelar
            </Botao>
          )}
        </div>
      </div>

      {/* Confirmação de cancelamento */}
      {confirmarCancelamento && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-6">
          <Cartao className="p-6 max-w-sm w-full">
            <h3 className="font-extrabold text-lg mb-2">Cancelar o pedido?</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-5">
              A empresa deixará de ver este pedido. Esta acção não pode ser revertida.
            </p>
            <div className="flex gap-2">
              <Botao variante="perigo" className="flex-1" onClick={cancelar} disabled={aCancelar}>
                {aCancelar ? "A cancelar…" : "Sim, cancelar"}
              </Botao>
              <Botao variante="contorno" className="flex-1" onClick={() => setConfirmarCancelamento(false)}>
                Voltar
              </Botao>
            </div>
          </Cartao>
        </div>
      )}
    </div>
  );
}

function distanciaHaversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
