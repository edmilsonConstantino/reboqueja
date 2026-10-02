"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mapa } from "@/components/Mapa";
import { Botao, Cartao, Etiqueta, Carregando, Vazio, Selector, AvisoErro } from "@/components/ui";
import { faixaPrecoTexto, formatarDataHora, formatarKm, formatarTelefone, formatarMinutos } from "@/lib/format";
import { LABEL_ESTADO, LABEL_PROBLEMA, LABEL_VEICULO, ICONES_ESTADO, ORDEM_ESTADOS, LABEL_PAGAMENTO } from "@/lib/constants-client";
import { PROXIMO_ESTADO, VELOCIDADE_MEDIA_KMH, EXPIRACAO_PEDIDO_MS } from "@/lib/constants";
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
};

export default function DetalhePedidoEmpresa() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [camioes, setCamioes] = useState<Camiao[]>([]);
  const [camiaoEscolhido, setCamiaoEscolhido] = useState("");
  const [erroMsg, setErroMsg] = useState("");
  const [aProcessar, setAProcessar] = useState(false);
  const [simulando, setSimulando] = useState(false);
  const simRef = useRef(false);
  const intervaloSim = useRef<ReturnType<typeof setInterval> | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch(`/api/pedidos/${id}`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Erro ao carregar.");
        return;
      }
      setPedido(d.pedido);
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
      setCamioes((d.camioes || []).filter((c: Camiao) => c.activo));
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (intervaloSim.current) clearInterval(intervaloSim.current);
    };
  }, []);

  const aceitar = async () => {
    if (!camiaoEscolhido) {
      setErroMsg("Escolha o camião e o motorista antes de aceitar.");
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
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        await fetch(`/api/pedidos/${id}/localizacao`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: p.coords.latitude, lng: p.coords.longitude }),
        });
        await carregar();
      },
      () => setErroMsg("Não foi possível obter o GPS do dispositivo."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  /** Simula o trajecto do camião até à origem (demonstração sem GPS real). */
  const simularTrajecto = () => {
    if (!pedido?.camiao) return;
    if (simRef.current) {
      // Parar
      simRef.current = false;
      setSimulando(false);
      if (intervaloSim.current) clearInterval(intervaloSim.current);
      return;
    }
    setSimulando(true);
    simRef.current = true;
    const destino: LatLng = { lat: pedido.origemLat, lng: pedido.origemLng };
    let actual: LatLng = { lat: pedido.camiao.lat, lng: pedido.camiao.lng };
    const totalKm = distanciaKm(actual, destino);
    const passos = Math.max(20, Math.min(120, Math.round(totalKm * 8)));
    let passo = 0;

    intervaloSim.current = setInterval(async () => {
      if (!simRef.current) return;
      passo++;
      const t = passo / passos;
      actual = {
        lat: actual.lat + (destino.lat - actual.lat) * (1 / (passos - passo + 1)),
        lng: actual.lng + (destino.lng - actual.lng) * (1 / (passos - passo + 1)),
      };
      // Alternativa mais estável: interpolação directa
      const p = interpolar(
        { lat: pedido.origemLat, lng: pedido.origemLng },
        destino,
        1 - t
      );
      void p;
      await fetch(`/api/pedidos/${id}/localizacao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: actual.lat, lng: actual.lng }),
      });
      await carregar();
      if (passo >= passos) {
        simRef.current = false;
        setSimulando(false);
        if (intervaloSim.current) clearInterval(intervaloSim.current);
      }
    }, 1500);
  };

  if (erroMsg && !pedido) {
    return <div className="p-6"><Vazio titulo="Erro" descricao={erroMsg} /></div>;
  }
  if (!pedido) return <div className="p-6"><Carregando /></div>;

  const origem: LatLng = { lat: pedido.origemLat, lng: pedido.origemLng };
  const destino: LatLng = { lat: pedido.destinoLat, lng: pedido.destinoLng };
  const posCamiao: LatLng | null = pedido.camiao
    ? { lat: pedido.camiao.lat, lng: pedido.camiao.lng }
    : null;
  const expirado =
    pedido.estado === "PENDENTE" &&
    Date.now() - new Date(pedido.criadoEm).getTime() > EXPIRACAO_PEDIDO_MS;
  const etaMin = posCamiao
    ? (distanciaKm(posCamiao, origem) / VELOCIDADE_MEDIA_KMH) * 60
    : null;

  return (
    <div className="fixed inset-0 pt-14 pb-[290px]">
      <Mapa
        centro={posCamiao && pedido.estado === "A_CAMINHO" ? posCamiao : origem}
        zoom={13}
        marcadores={[
          { id: "o", pos: origem, emoji: "🚗", cor: "#FFC300", pulso: pedido.estado === "PENDENTE" },
          { id: "d", pos: destino, emoji: "🏁", cor: "#10B981" },
          ...(posCamiao ? [{ id: "c", pos: posCamiao, emoji: "🚚", cor: "#0EA5E9" }] : []),
        ]}
        linha={posCamiao && ["A_CAMINHO", "NO_LOCAL"].includes(pedido.estado) ? [posCamiao, origem] : null}
        encaixarEm
        className="absolute inset-0"
      />

      <div className="absolute z-30 inset-x-0 bottom-0 max-h-[58vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-t-3xl shadow-sheet p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-extrabold">
            {LABEL_ESTADO[pedido.estado]}
            {expirado && <span className="text-red-500 text-sm"> · expirado</span>}
          </h1>
          <Etiqueta cor={pedido.estado === "CONCLUIDO" ? "verde" : pedido.estado === "CANCELADO" ? "vermelho" : "amarelo"}>
            {LABEL_ESTADO[pedido.estado]}
          </Etiqueta>
        </div>

        {/* Condutor e veículo */}
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
          <p><span className="text-neutral-500">De:</span> {pedido.origemEndereco}</p>
          <p><span className="text-neutral-500">Para:</span> {pedido.destinoEndereco} ({formatarKm(pedido.distanciaKm)})</p>
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
              rotulo="Camião e motorista"
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
                Passaram mais de 3 minutos — o condutor pode já ter ido para outra empresa.
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

        {/* Avançar estado + simulação */}
        {pedido.empresa && pedido.camiao && ["ACEITE", "A_CAMINHO", "NO_LOCAL", "EM_TRANSPORTE"].includes(pedido.estado) && (
          <Cartao className="p-4 space-y-3">
            <div className="flex gap-2">
              <Botao className="flex-1" onClick={avancarEstado} disabled={aProcessar}>
                {ICONES_ESTADO[PROXIMO_ESTADO[pedido.estado] || ""]} Avançar para{" "}
                {LABEL_ESTADO[PROXIMO_ESTADO[pedido.estado] || ""]}
              </Botao>
            </div>
            <div className="flex gap-2">
              <Botao variante="contorno" className="flex-1 text-xs" onClick={partilharGPS}>
                📍 Partilhar localização (GPS)
              </Botao>
              <Botao variante="contorno" className="flex-1 text-xs" onClick={simularTrajecto}>
                {simulando ? "⏹ Parar simulação" : "▶ Simular trajecto"}
              </Botao>
            </div>
            {etaMin !== null && pedido.estado === "A_CAMINHO" && (
              <p className="text-xs text-neutral-500">
                ETA até à origem: ~{formatarMinutos(etaMin)} ({formatarKm(distanciaKm(posCamiao!, origem))})
              </p>
            )}
          </Cartao>
        )}

        {/* Confirmar pagamento */}
        {pedido.estado === "CONCLUIDO" && pedido.metodoPagamento && !pedido.pagamentoConfirmado && (
          <Cartao className="p-4">
            <p className="text-sm mb-3">
              O condutor indicou <b>{LABEL_PAGAMENTO[pedido.metodoPagamento]}</b>. Confirme o
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

function distanciaKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function interpolar(a: LatLng, b: LatLng, t: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}
