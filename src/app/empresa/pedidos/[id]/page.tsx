"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mapa } from "@/components/Mapa";
import { Botao, Cartao, Etiqueta, Carregando, Vazio, Selector, AvisoErro } from "@/components/ui";
import { faixaPrecoTexto, formatarDataHora, formatarKm, formatarTelefone, formatarMinutos } from "@/lib/format";
import { LABEL_ESTADO, LABEL_PROBLEMA, LABEL_VEICULO, ICONES_ESTADO, LABEL_PAGAMENTO } from "@/lib/constants-client";
import { PROXIMO_ESTADO, EXPIRACAO_PEDIDO_MS } from "@/lib/constants";
import { coordenadasValidas, type LatLng, type ResultadoRota } from "@/lib/geo";

type Pedido = {
  id: string;
  estado: string;
  origemLat: number; origemLng: number; origemEndereco: string;
  destinoLat: number | null; destinoLng: number | null; destinoEndereco: string | null;
  distanciaKm: number;
  tipoProblema: string;
  tipoVeiculo: string;
  observacoes: string | null;
  precoMin: number; precoMax: number;
  metodoPagamento: string | null;
  pagamentoConfirmado: boolean;
  criadoEm: string;
  condutor: { nome: string; telefone: string };
  veiculo: { marca: string; modelo: string; matricula: string; tipo: string } | null;
  empresa: { id: string; nome: string; telefone: string } | null;
  camiao: {
    id: string;
    matricula: string; tipo: string; motoristaNome: string;
    motoristaTelefone: string; lat: number; lng: number;
  } | null;
  eventos: { id: string; estado: string; nota: string | null; criadoEm: string }[];
  avaliacao: { estrelas: number; comentario: string | null } | null;
};

type Camiao = {
  id: string; matricula: string; tipo: string; motoristaNome: string; activo: boolean;
  motorista: { id: string; nome: string; activo: boolean } | null;
};

export default function DetalhePedidoEmpresa() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [rota, setRota] = useState<ResultadoRota | null>(null);
  const [distanciaLinhaRetaKm, setDistanciaLinhaRetaKm] = useState<number | null>(null);
  const [camioes, setCamioes] = useState<Camiao[]>([]);
  const [camiaoEscolhido, setCamiaoEscolhido] = useState("");
  const [erroMsg, setErroMsg] = useState("");
  const [aProcessar, setAProcessar] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch(`/api/pedidos/${id}`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Erro ao carregar.");
        return;
      }
      setPedido(d.pedido);
      setRota(d.rota ?? null);
      setDistanciaLinhaRetaKm(typeof d.distanciaLinhaRetaKm === "number" ? d.distanciaLinhaRetaKm : null);
      if (d.pedido.camiao) setCamiaoEscolhido(d.pedido.camiao.id);
    } catch {
      setErroMsg("Erro de rede.");
    }
  }, [id]);

  useEffect(() => {
    carregar();
    const i = setInterval(carregar, 5000);
    return () => clearInterval(i);
  }, [carregar]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/empresa/camioes");
      const d = await res.json();
      setCamioes((d.camioes || []).filter((c: Camiao) => c.activo && c.motorista?.activo));
    })();
  }, []);

  const aceitar = async () => {
    if (!camiaoEscolhido) {
      setErroMsg("Escolha o camião e o condutor antes de aceitar.");
      return;
    }
    setAProcessar(true);
    setErroMsg("");
    try {
      const res = await fetch(`/api/pedidos/${id}/aceitar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ camiaoId: camiaoEscolhido, empresaId: pedido?.empresa?.id }),
      });
      const d = await res.json();
      if (!res.ok) setErroMsg(d.erro || "Erro ao aceitar.");
      else await carregar();
    } finally {
      setAProcessar(false);
    }
  };

  const recusar = async () => {
    setAProcessar(true);
    try {
      await fetch(`/api/pedidos/${id}/aceitar`, { method: "DELETE" });
      router.push("/empresa");
    } finally {
      setAProcessar(false);
    }
  };

  const avancarEstado = async () => {
    if (!pedido) return;
    const proximo = PROXIMO_ESTADO[pedido.estado];
    if (!proximo) return;
    setAProcessar(true);
    setErroMsg("");
    try {
      const res = await fetch(`/api/pedidos/${id}/aceitar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: proximo }),
      });
      const d = await res.json();
      if (!res.ok) setErroMsg(d.erro || "Erro ao avançar estado.");
      else await carregar();
    } finally {
      setAProcessar(false);
    }
  };

  const confirmarPagamento = async () => {
    setAProcessar(true);
    try {
      await fetch(`/api/pedidos/${id}/concluir`, { method: "PATCH" });
      await carregar();
    } finally {
      setAProcessar(false);
    }
  };

  /** Partilha a posição GPS real do dispositivo como posição do camião. */
  const partilharGPS = () => {
    if (!navigator.geolocation) {
      setErroMsg("Localização indisponível neste dispositivo.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        await fetch(`/api/pedidos/${id}/localizacao`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: p.coords.latitude, lng: p.coords.longitude }),
        });
        await carregar();
      },
      () => setErroMsg("Não foi possível obter a localização GPS do dispositivo."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  if (erroMsg && !pedido) {
    return <div className="p-6"><Vazio titulo="Erro" descricao={erroMsg} /></div>;
  }
  if (!pedido) return <div className="p-6"><Carregando /></div>;

  const origem: LatLng = { lat: pedido.origemLat, lng: pedido.origemLng };
  const destino: LatLng | null =
    pedido.destinoLat != null && pedido.destinoLng != null
      ? { lat: pedido.destinoLat, lng: pedido.destinoLng }
      : null;
  const posCamiao: LatLng | null =
    pedido.camiao && coordenadasValidas({ lat: pedido.camiao.lat, lng: pedido.camiao.lng })
      ? { lat: pedido.camiao.lat, lng: pedido.camiao.lng }
      : null;
  const expirado =
    pedido.estado === "PENDENTE" &&
    Date.now() - new Date(pedido.criadoEm).getTime() > EXPIRACAO_PEDIDO_MS;

  const linhaMapa: LatLng[] | null =
    rota?.disponivel && rota.geometria && rota.geometria.length >= 2
      ? rota.geometria
      : posCamiao && ["A_CAMINHO", "NO_LOCAL"].includes(pedido.estado)
        ? [posCamiao, origem]
        : null;

  return (
    <div className="fixed inset-0 pt-[calc(3.5rem_+_env(safe-area-inset-top))] pb-[290px]">
      <Mapa
        centro={posCamiao && pedido.estado === "A_CAMINHO" ? posCamiao : origem}
        zoom={13}
        marcadores={[
          { id: "o", pos: origem, emoji: "🚗", cor: "#FFC300", pulso: pedido.estado === "PENDENTE" },
          ...(destino ? [{ id: "d", pos: destino, emoji: "🏁", cor: "#10B981" }] : []),
          ...(posCamiao ? [{ id: "c", pos: posCamiao, emoji: "🚚", cor: "#0EA5E9" }] : []),
        ]}
        linha={linhaMapa}
        encaixarEm
        className="absolute inset-0"
      />

      <div className="absolute z-30 inset-x-0 bottom-0 max-h-[58vh] overflow-y-auto rj-sheet-scroll bg-white dark:bg-neutral-900 rounded-t-3xl shadow-sheet p-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))] space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-extrabold">
            {LABEL_ESTADO[pedido.estado] || pedido.estado}
            {expirado && <span className="text-red-500 text-sm"> · expirado</span>}
          </h1>
          <Etiqueta
            cor={
              pedido.estado === "CONCLUIDO"
                ? "verde"
                : pedido.estado === "CANCELADO" || pedido.estado === "RECUSADO"
                  ? "vermelho"
                  : "amarelo"
            }
          >
            {LABEL_ESTADO[pedido.estado] || pedido.estado}
          </Etiqueta>
        </div>

        {/* Cliente e veículo */}
        <Cartao className="p-4 text-sm">
          <p className="font-bold">{pedido.condutor.nome}</p>
          <p className="text-neutral-500 dark:text-neutral-400">
            📞 {formatarTelefone(pedido.condutor.telefone)}
          </p>
          {pedido.veiculo && (
            <p className="text-neutral-500 dark:text-neutral-400">
              🚗 {pedido.veiculo.marca} {pedido.veiculo.modelo} · {pedido.veiculo.matricula} ({LABEL_VEICULO[pedido.veiculo.tipo]})
            </p>
          )}
          <p className="mt-2">
            <span className="text-neutral-500">Problema:</span>{" "}
            {LABEL_PROBLEMA[pedido.tipoProblema]} · {LABEL_VEICULO[pedido.tipoVeiculo]}
          </p>
          <p><span className="text-neutral-500">Recolha:</span> {pedido.origemEndereco}</p>
          <p>
            <span className="text-neutral-500">Destino:</span>{" "}
            {pedido.destinoEndereco || "Não indicado"} ({formatarKm(pedido.distanciaKm)})
          </p>
          <p>
            <span className="text-neutral-500">Faixa:</span>{" "}
            <b className="text-primary-600 dark:text-primary-400">{faixaPrecoTexto(pedido.precoMin, pedido.precoMax)}</b>
          </p>
          {pedido.observacoes && <p><span className="text-neutral-500">Obs.:</span> {pedido.observacoes}</p>}
          {pedido.metodoPagamento && (
            <p className="mt-1">
              💰 Pagamento: {LABEL_PAGAMENTO[pedido.metodoPagamento]}{" "}
              {pedido.pagamentoConfirmado ? "✅ confirmado" : "· a confirmar"}
            </p>
          )}
        </Cartao>

        {/* Aceitar / recusar */}
        {pedido.estado === "PENDENTE" && (
          <Cartao className="p-4 space-y-3">
            <Selector
              rotulo="Camião e condutor"
              value={camiaoEscolhido}
              onChange={(e) => setCamiaoEscolhido(e.target.value)}
            >
              <option value="">— Escolher camião —</option>
              {camioes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.matricula} · {c.motoristaNome} ({LABEL_VEICULO[c.tipo]})
                </option>
              ))}
            </Selector>
            {expirado && (
              <p className="text-xs text-red-500">
                Passaram mais de 3 minutos — a solicitação pode ter expirado.
              </p>
            )}
            <div className="flex gap-2">
              <Botao className="flex-1" onClick={aceitar} disabled={aProcessar || !camiaoEscolhido}>
                ✅ Aceitar
              </Botao>
              <Botao variante="contorno" className="flex-1" onClick={recusar} disabled={aProcessar}>
                ✖ Recusar
              </Botao>
            </div>
          </Cartao>
        )}

        {/* Avançar estado + GPS real */}
        {pedido.empresa && pedido.camiao && ["ACEITE", "A_CAMINHO", "NO_LOCAL", "EM_TRANSPORTE"].includes(pedido.estado) && (
          <Cartao className="p-4 space-y-3">
            <div className="flex gap-2">
              <Botao className="flex-1" onClick={avancarEstado} disabled={aProcessar}>
                {ICONES_ESTADO[PROXIMO_ESTADO[pedido.estado] || ""]} Avançar para{" "}
                {LABEL_ESTADO[PROXIMO_ESTADO[pedido.estado] || ""]}
              </Botao>
            </div>
            <Botao variante="contorno" className="w-full text-xs" onClick={partilharGPS}>
              📍 Actualizar localização GPS real
            </Botao>
            {pedido.estado === "A_CAMINHO" && (
              <p className="text-xs text-neutral-500">
                {rota?.disponivel && rota.tempoEstimadoMin !== null
                  ? `Por estrada: ~${formatarMinutos(rota.tempoEstimadoMin)} (${formatarKm(rota.distanciaEstradaKm ?? 0)})`
                  : distanciaLinhaRetaKm !== null
                    ? `Linha reta até recolha: ${formatarKm(distanciaLinhaRetaKm)}`
                    : "Sem localização GPS recente do camião"}
              </p>
            )}
          </Cartao>
        )}

        {/* Confirmar pagamento */}
        {pedido.estado === "CONCLUIDO" && pedido.metodoPagamento && !pedido.pagamentoConfirmado && (
          <Cartao className="p-4">
            <p className="text-sm mb-3">
              O cliente indicou <b>{LABEL_PAGAMENTO[pedido.metodoPagamento]}</b>. Confirme o
              recebimento.
            </p>
            <Botao variante="sucesso" className="w-full" onClick={confirmarPagamento} disabled={aProcessar}>
              ✅ Confirmar recebimento
            </Botao>
          </Cartao>
        )}

        {/* Avaliação recebida */}
        {pedido.avaliacao && (
          <Cartao className="p-4 text-sm">
            ⭐ Avaliação: <b>{pedido.avaliacao.estrelas}</b>/5
            {pedido.avaliacao.comentario ? ` — "${pedido.avaliacao.comentario}"` : ""}
          </Cartao>
        )}

        {/* Timeline */}
        <Cartao className="p-4">
          <h2 className="text-sm font-bold mb-3">Linha do tempo</h2>
          <div className="space-y-2">
            {pedido.eventos.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 text-sm">
                <span className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 grid place-items-center text-xs">
                  {ICONES_ESTADO[ev.estado] || "•"}
                </span>
                <div>
                  <p className="font-semibold">{LABEL_ESTADO[ev.estado] || ev.estado}</p>
                  <p className="text-xs text-neutral-500">
                    {formatarDataHora(ev.criadoEm)}
                    {ev.nota ? ` · ${ev.nota}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Cartao>

        <AvisoErro>{erroMsg}</AvisoErro>
        <div className="pb-2">
          <Botao variante="fantasma" className="w-full" onClick={() => router.push("/empresa")}>
            ← Voltar ao painel
          </Botao>
        </div>
      </div>
    </div>
  );
}
