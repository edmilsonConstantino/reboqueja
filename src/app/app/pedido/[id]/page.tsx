"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mapa } from "@/components/Mapa";
import { Botao, Cartao, Etiqueta, Carregando, Vazio } from "@/components/ui";
import { faixaPrecoTexto, formatarDataHora, formatarKm, formatarTelefone, formatarMinutos } from "@/lib/format";
import { LABEL_ESTADO, LABEL_PROBLEMA, LABEL_VEICULO, ORDEM_ESTADOS, ICONES_ESTADO, LABEL_PAGAMENTO } from "@/lib/constants-client";
import type { LatLng, ResultadoRota } from "@/lib/geo";

type Pedido = {
  id: string;
  estado: string;
  motivoRecusa: string | null;
  origemLat: number; origemLng: number; origemEndereco: string;
  destinoLat: number | null; destinoLng: number | null; destinoEndereco: string | null;
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
  const [localizacaoCamiaoActiva, setLocalizacaoCamiaoActiva] = useState(false);
  const [distanciaLinhaRetaKm, setDistanciaLinhaRetaKm] = useState<number | null>(null);
  const [rota, setRota] = useState<ResultadoRota | null>(null);
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
      setExpirado(Boolean(d.expirado));
      setLocalizacaoCamiaoActiva(Boolean(d.localizacaoCamiaoActiva));
      setDistanciaLinhaRetaKm(typeof d.distanciaLinhaRetaKm === "number" ? d.distanciaLinhaRetaKm : null);
      setRota(d.rota ?? null);
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

  const escolherOutraOpcao = async (cancelarAntes: boolean) => {
    if (!pedido) return;
    sessionStorage.setItem(
      "rj-rascunho",
      JSON.stringify({
        origemLat: pedido.origemLat,
        origemLng: pedido.origemLng,
        origemEndereco: pedido.origemEndereco,
        destinoLat: pedido.destinoLat,
        destinoLng: pedido.destinoLng,
        destinoEndereco: pedido.destinoEndereco,
        tipoProblema: pedido.tipoProblema,
        tipoVeiculo: pedido.tipoVeiculo,
        observacoes: pedido.observacoes,
      })
    );
    if (cancelarAntes) {
      await fetch(`/api/pedidos/${id}`, { method: "DELETE" });
    }
    router.push("/app/pedido/novo");
  };

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
  const destino: LatLng | null =
    pedido.destinoLat != null && pedido.destinoLng != null
      ? { lat: pedido.destinoLat, lng: pedido.destinoLng }
      : null;
  const camiao: LatLng | null =
    localizacaoCamiaoActiva && pedido.camiao && (pedido.camiao.lat !== 0 || pedido.camiao.lng !== 0)
      ? { lat: pedido.camiao.lat, lng: pedido.camiao.lng }
      : null;
  const emCurso = ["PENDENTE", "ACEITE", "A_CAMINHO", "NO_LOCAL", "EM_TRANSPORTE"].includes(pedido.estado);

  const marcadores = [
    { id: "o", pos: origem, emoji: "🚗", cor: "#FFC300", pulso: pedido.estado === "PENDENTE", titulo: "Local da avaria" },
    ...(destino ? [{ id: "d", pos: destino, emoji: "🏁", cor: "#10B981", titulo: "Destino" }] : []),
    ...(camiao
      ? [{ id: "c", pos: camiao, emoji: "🚚", cor: "#0EA5E9", pulso: pedido.estado === "A_CAMINHO", titulo: "Reboque" }]
      : []),
  ];

  const linhaMapa: LatLng[] | null =
    rota?.disponivel && rota.geometria && rota.geometria.length >= 2
      ? rota.geometria
      : camiao && ["ACEITE", "A_CAMINHO"].includes(pedido.estado)
        ? [camiao, origem]
        : pedido.estado === "EM_TRANSPORTE" && destino
          ? [origem, destino]
          : null;

  const corBadge =
    pedido.estado === "CONCLUIDO"
      ? "verde"
      : pedido.estado === "CANCELADO" || pedido.estado === "RECUSADO"
        ? "vermelho"
        : "amarelo";

  return (
    <div className="fixed inset-0 pt-[calc(3.5rem_+_env(safe-area-inset-top))] pb-[300px]">
      <Mapa
        centro={camiao && ["A_CAMINHO", "ACEITE"].includes(pedido.estado) ? camiao : origem}
        zoom={13}
        marcadores={marcadores}
        linha={linhaMapa}
        encaixarEm
        className="absolute inset-0"
      />

      <div className="absolute z-30 inset-x-0 bottom-0 max-h-[58vh] overflow-y-auto rj-sheet-scroll bg-white dark:bg-neutral-900 rounded-t-3xl shadow-sheet p-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))] space-y-4">
        {/* Estado principal */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-extrabold">
              {pedido.estado === "PENDENTE"
                ? expirado
                  ? "Sem resposta do condutor…"
                  : "A aguardar confirmação do condutor."
                : LABEL_ESTADO[pedido.estado] || pedido.estado}
            </h1>
            {pedido.estado === "PENDENTE" && !expirado && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                A tua solicitação foi enviada para {pedido.empresa?.nome ?? "o condutor escolhido"}.
              </p>
            )}
            {["ACEITE", "A_CAMINHO"].includes(pedido.estado) && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {rota?.disponivel && rota.tempoEstimadoMin !== null
                  ? `Tempo estimado por estrada: ${formatarMinutos(rota.tempoEstimadoMin)} (${formatarKm(rota.distanciaEstradaKm ?? 0)}).`
                  : distanciaLinhaRetaKm !== null
                    ? `Distância em linha reta até si: ${formatarKm(distanciaLinhaRetaKm)} (rota por estrada indisponível).`
                    : "O condutor está a preparar a deslocação."}
              </p>
            )}
          </div>
          <Etiqueta cor={corBadge}>{LABEL_ESTADO[pedido.estado] || pedido.estado}</Etiqueta>
        </div>

        {/* Radar quando pendente */}
        {pedido.estado === "PENDENTE" && !expirado && (
          <div className="relative h-16 flex items-center justify-center overflow-hidden">
            <div className="absolute w-16 h-16 rounded-full bg-primary-400/25 rj-radar" />
            <div className="absolute w-16 h-16 rounded-full bg-primary-400/20 rj-radar" style={{ animationDelay: "0.6s" }} />
            <span className="text-3xl relative">🛻</span>
          </div>
        )}

        {/* Recusado pelo condutor */}
        {pedido.estado === "RECUSADO" && (
          <Cartao className="p-4 border-red-300 dark:border-red-900 bg-red-50/70 dark:bg-red-950/20 space-y-3">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              O condutor não aceitou o pedido. Podes escolher outra opção disponível.
            </p>
            {pedido.motivoRecusa && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Motivo: {pedido.motivoRecusa}
              </p>
            )}
            <Botao className="w-full" onClick={() => escolherOutraOpcao(false)}>
              Escolher outra opção disponível
            </Botao>
          </Cartao>
        )}

        {/* Expirado: escolher outro veículo ou cancelar */}
        {pedido.estado === "PENDENTE" && expirado && (
          <Cartao className="p-4 border-primary-200 dark:border-primary-900">
            <p className="text-sm font-semibold mb-3">
              O condutor não respondeu dentro do tempo limite. O que pretende fazer?
            </p>
            <div className="flex gap-2">
              <Botao className="flex-1" onClick={() => escolherOutraOpcao(true)}>
                Escolher outro veículo
              </Botao>
              <Botao variante="contorno" className="flex-1" onClick={() => setConfirmarCancelamento(true)}>
                Cancelar
              </Botao>
            </div>
          </Cartao>
        )}

        {/* Cartão da empresa e veículo escolhido */}
        {pedido.empresa && pedido.camiao && (
          <Cartao className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{pedido.empresa.nome}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Condutor: {pedido.camiao.motoristaNome}
                  {pedido.estado !== "PENDENTE" && pedido.estado !== "RECUSADO"
                    ? ` · ${formatarTelefone(pedido.camiao.motoristaTelefone)}`
                    : ""}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Camião: {pedido.camiao.matricula} ({LABEL_VEICULO[pedido.camiao.tipo] || pedido.camiao.tipo})
                </p>
              </div>
              {pedido.estado !== "PENDENTE" && pedido.estado !== "RECUSADO" && pedido.estado !== "CANCELADO" && (
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
              )}
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
              const encerrado =
                (pedido.estado === "CANCELADO" || pedido.estado === "RECUSADO") &&
                idx > ORDEM_ESTADOS.indexOf("PENDENTE");
              if (encerrado && !ev) return null;
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
            {pedido.estado === "RECUSADO" && (
              <div className="flex items-start gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 grid place-items-center text-sm z-10">
                  🚫
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-600">Recusado pelo condutor</p>
                  <p className="text-xs text-neutral-500">
                    {formatarDataHora(pedido.eventos.find((e) => e.estado === "RECUSADO")?.criadoEm || pedido.criadoEm)}
                  </p>
                </div>
              </div>
            )}
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
          <p><span className="text-neutral-500">Recolha:</span> {pedido.origemEndereco}</p>
          <p><span className="text-neutral-500">Destino:</span> {pedido.destinoEndereco || "Não indicado"}</p>
          <p>
            <span className="text-neutral-500">Distância em linha reta:</span>{" "}
            {formatarKm(distanciaLinhaRetaKm ?? pedido.distanciaKm)}
          </p>
          <p>
            <span className="text-neutral-500">Distância por estrada:</span>{" "}
            {rota?.disponivel && rota.distanciaEstradaKm !== null
              ? formatarKm(rota.distanciaEstradaKm)
              : "Indisponível"}
          </p>
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
          {emCurso && pedido.estado !== "PENDENTE" && ["ACEITE", "A_CAMINHO"].includes(pedido.estado) && (
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
              O condutor deixará de ver esta solicitação. Esta acção não pode ser revertida.
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
