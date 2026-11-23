"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Mapa, type MarcadorMapa } from "@/components/Mapa";
import { usarTema } from "@/components/ProvedorTema";
import {
  SolicitacaoLocalizacao,
  type EstadoPermissaoGps,
} from "@/components/SolicitacaoLocalizacao";
import { AvisoErro, Botao, Cartao, Carregando, Etiqueta, Vazio } from "@/components/ui";
import { faixaPrecoTexto, formatarDataHora, formatarKm, formatarTelefone } from "@/lib/format";
import { LABEL_ESTADO, LABEL_PROBLEMA, LABEL_VEICULO } from "@/lib/constants-client";
import { PROXIMO_ESTADO } from "@/lib/constants";
import { coordenadasValidas, type LatLng } from "@/lib/geo";

type Pedido = {
  id: string;
  estado: string;
  criadoEm: string;
  origemLat: number;
  origemLng: number;
  origemEndereco: string;
  destinoLat: number | null;
  destinoLng: number | null;
  destinoEndereco: string | null;
  distanciaKm: number;
  distanciaAteRecolhaKm: number | null;
  tipoProblema: string;
  tipoVeiculo: string;
  precoMin: number;
  precoMax: number;
  observacoes: string | null;
  cliente: { nome: string; telefone: string; contactoMascarado?: boolean };
};

type Painel = {
  condutor: { nome: string };
  camiao: {
    id: string;
    matricula: string;
    tipo: string;
    activo: boolean;
    disponivel: boolean;
    partilhaLocalizacao: boolean;
    localizacaoActualizadaEm: string | null;
    lat: number;
    lng: number;
  } | null;
  empresa: {
    nome: string;
    telefone: string;
    disponivel: boolean;
    estadoAprovacao: string;
  } | null;
  podeOperar: boolean;
  podeReceber: boolean;
  localizacaoValida: boolean;
  activo: Pedido | null;
  disponiveis: Pedido[];
  media: number | null;
  totalAvaliacoes: number;
  hoje: { concluidos: number; receitaMin: number; receitaMax: number };
};

const MSG_GPS_INDISPONIVEL =
  "Não foi possível obter a tua localização. Activa a localização do dispositivo e concede autorização à aplicação.";

export default function PainelCondutor() {
  const { tema } = usarTema();
  const [dados, setDados] = useState<Painel | null>(null);
  const [erroMsg, setErroMsg] = useState("");
  const [erroGps, setErroGps] = useState("");
  const [gpsEstado, setGpsEstado] = useState<EstadoPermissaoGps>("checking");
  const [gpsDispositivo, setGpsDispositivo] = useState<LatLng | null>(null);
  const [gatilhoGps, setGatilhoGps] = useState(0);
  const [aProcessar, setAProcessar] = useState(false);
  const [aAlternarDisp, setAAlternarDisp] = useState(false);

  const idsConhecidosRef = useRef<Set<string>>(new Set());
  const primeiraCargaRef = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ultimaSyncGpsRef = useRef<number>(0);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/condutor/painel", { cache: "no-store" });
      const d = (await res.json()) as Painel & { erro?: string };
      if (!res.ok) {
        setErroMsg(d.erro || "Erro ao carregar o painel.");
        return;
      }

      if (!primeiraCargaRef.current && d.podeReceber && !d.activo) {
        const actuais = new Set((d.disponiveis || []).map((p) => p.id));
        let temNovo = false;
        for (const id of actuais) {
          if (!idsConhecidosRef.current.has(id)) temNovo = true;
        }
        if (temNovo) {
          try {
            audioRef.current = audioRef.current || new Audio("/novo-pedido.wav");
            audioRef.current.play().catch(() => {});
          } catch {}
        }
      }
      primeiraCargaRef.current = false;
      idsConhecidosRef.current = new Set((d.disponiveis || []).map((p) => p.id));

      setDados(d);
      setErroMsg("");
    } catch {
      setErroMsg("Erro de rede.");
    }
  }, []);

  useEffect(() => {
    carregar();
    const i = setInterval(carregar, 5000);
    return () => clearInterval(i);
  }, [carregar]);

  const enviarLocalizacao = useCallback(async (lat: number, lng: number) => {
    const agora = Date.now();
    if (agora - ultimaSyncGpsRef.current < 8000) return;
    ultimaSyncGpsRef.current = agora;
    try {
      await fetch("/api/condutor/localizacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });
    } catch {}
  }, []);

  const aoObterGpsInicial = useCallback(
    (pos: LatLng) => {
      setErroGps("");
      setGpsDispositivo(pos);
      if (dados?.camiao && (dados.camiao.disponivel || dados.activo)) {
        ultimaSyncGpsRef.current = 0;
        void enviarLocalizacao(pos.lat, pos.lng);
      }
    },
    [dados?.camiao, dados?.activo, enviarLocalizacao]
  );

  // Partilha periódica contínua enquanto disponível OU com serviço em execução
  const devePartilharGps = Boolean(
    dados?.camiao && (dados.camiao.disponivel || dados.activo)
  );

  useEffect(() => {
    if (!devePartilharGps) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setErroGps(MSG_GPS_INDISPONIVEL);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setErroGps("");
        enviarLocalizacao(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setErroGps(MSG_GPS_INDISPONIVEL);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );

    const heartbeat = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setErroGps("");
          ultimaSyncGpsRef.current = 0;
          enviarLocalizacao(pos.coords.latitude, pos.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 8000 }
      );
    }, 20000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(heartbeat);
    };
  }, [devePartilharGps, enviarLocalizacao]);

  const alternarDisponibilidade = async (ficarDisponivel: boolean) => {
    setErroMsg("");
    setErroGps("");

    if (!ficarDisponivel) {
      setAAlternarDisp(true);
      try {
        const res = await fetch("/api/condutor/disponibilidade", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ disponivel: false }),
        });
        const d = await res.json();
        if (!res.ok) setErroMsg(d.erro || "Não foi possível alterar o estado.");
        await carregar();
      } finally {
        setAAlternarDisp(false);
      }
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setErroGps(MSG_GPS_INDISPONIVEL);
      return;
    }

    setAAlternarDisp(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setGpsDispositivo(coords);
          const res = await fetch("/api/condutor/disponibilidade", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              disponivel: true,
              lat: coords.lat,
              lng: coords.lng,
            }),
          });
          const d = await res.json();
          if (!res.ok) {
            setErroMsg(d.erro || "Não foi possível activar a disponibilidade.");
          } else {
            ultimaSyncGpsRef.current = Date.now();
          }
          await carregar();
        } finally {
          setAAlternarDisp(false);
        }
      },
      () => {
        setAAlternarDisp(false);
        if (gpsDispositivo) {
          void (async () => {
            setAAlternarDisp(true);
            try {
              const res = await fetch("/api/condutor/disponibilidade", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  disponivel: true,
                  lat: gpsDispositivo.lat,
                  lng: gpsDispositivo.lng,
                }),
              });
              const d = await res.json();
              if (!res.ok) {
                setErroMsg(d.erro || "Não foi possível activar a disponibilidade.");
              }
              await carregar();
            } finally {
              setAAlternarDisp(false);
            }
          })();
          return;
        }
        setErroGps(MSG_GPS_INDISPONIVEL);
        setGatilhoGps((n) => n + 1);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const aceitar = async (pedidoId: string) => {
    setAProcessar(true);
    setErroMsg("");
    try {
      const res = await fetch("/api/condutor/aceitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId }),
      });
      const d = await res.json();
      if (!res.ok) setErroMsg(d.erro || "Não foi possível aceitar a solicitação.");
      await carregar();
    } finally {
      setAProcessar(false);
    }
  };

  const recusar = async (pedidoId: string) => {
    setAProcessar(true);
    setErroMsg("");
    try {
      const res = await fetch("/api/condutor/recusar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId }),
      });
      const d = await res.json();
      if (!res.ok) setErroMsg(d.erro || "Não foi possível recusar a solicitação.");
      await carregar();
    } finally {
      setAProcessar(false);
    }
  };

  const avancar = async () => {
    if (!dados?.activo) return;
    const proximo = PROXIMO_ESTADO[dados.activo.estado];
    if (!proximo) return;
    setAProcessar(true);
    setErroMsg("");
    try {
      const res = await fetch(`/api/condutor/pedidos/${dados.activo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: proximo }),
      });
      const d = await res.json();
      if (!res.ok) setErroMsg(d.erro || "Não foi possível avançar o estado.");
      await carregar();
    } finally {
      setAProcessar(false);
    }
  };

  const marcadores = useMemo<MarcadorMapa[]>(() => {
    const lista: MarcadorMapa[] = [];
    if (dados?.camiao && coordenadasValidas({ lat: dados.camiao.lat, lng: dados.camiao.lng }) && (dados.camiao.partilhaLocalizacao || dados.activo)) {
      lista.push({
        id: "camiao",
        pos: { lat: dados.camiao.lat, lng: dados.camiao.lng },
        emoji: "🚚",
        cor: "#0EA5E9",
        pulso: Boolean(dados.camiao.disponivel),
        titulo: "A tua localização actual",
      });
    }
    if (dados?.activo) {
      const p = dados.activo;
      lista.push({
        id: "origem",
        pos: { lat: p.origemLat, lng: p.origemLng },
        emoji: "🚗",
        cor: "#FFC300",
        pulso: true,
        titulo: `Recolha: ${p.origemEndereco}`,
      });
      if (p.destinoLat != null && p.destinoLng != null) {
        lista.push({
          id: "destino",
          pos: { lat: p.destinoLat, lng: p.destinoLng },
          emoji: "🏁",
          cor: "#10B981",
          titulo: `Destino: ${p.destinoEndereco ?? ""}`,
        });
      }
    }
    return lista;
  }, [dados?.activo, dados?.camiao]);

  const centro: LatLng | undefined = useMemo(() => {
    if (dados?.activo) {
      return { lat: dados.activo.origemLat, lng: dados.activo.origemLng };
    }
    if (dados?.camiao && coordenadasValidas({ lat: dados.camiao.lat, lng: dados.camiao.lng })) {
      return { lat: dados.camiao.lat, lng: dados.camiao.lng };
    }
    return undefined;
  }, [dados?.activo, dados?.camiao]);

  const linhaServico: LatLng[] | null = useMemo(() => {
    const act = dados?.activo;
    if (!act) return null;
    if (
      ["ACEITE", "A_CAMINHO", "NO_LOCAL"].includes(act.estado) &&
      dados?.camiao &&
      coordenadasValidas({ lat: dados.camiao.lat, lng: dados.camiao.lng })
    ) {
      return [
        { lat: dados.camiao.lat, lng: dados.camiao.lng },
        { lat: act.origemLat, lng: act.origemLng },
      ];
    }
    if (act.destinoLat != null && act.destinoLng != null) {
      return [
        { lat: act.origemLat, lng: act.origemLng },
        { lat: act.destinoLat, lng: act.destinoLng },
      ];
    }
    return null;
  }, [dados?.activo, dados?.camiao]);

  if (!dados) {
    return (
      <div className="p-6">
        {erroMsg ? <Vazio titulo="Erro" descricao={erroMsg} /> : <Carregando />}
      </div>
    );
  }

  if (!dados.camiao) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Vazio
          titulo="Sem camião atribuído"
          descricao="A sua conta de condutor ainda não está ligada a um camião. Peça à empresa para o associar em Camiões → Conta de condutor."
        />
      </div>
    );
  }

  const activo = dados.activo;
  const proximo = activo ? PROXIMO_ESTADO[activo.estado] : null;
  const estaDisponivel = Boolean(dados.camiao.disponivel && dados.localizacaoValida);

  const estadoTexto = activo
    ? "Em serviço"
    : estaDisponivel
      ? "Disponível para serviços"
      : "Indisponível";

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-slate-100/80 dark:bg-[#070B14] transition-colors duration-200">
      <SolicitacaoLocalizacao
        perfil="CONDUTOR"
        aoObterLocalizacao={aoObterGpsInicial}
        aoAlterarEstado={setGpsEstado}
        gatilhoAbrir={gatilhoGps}
      />
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Cabeçalho + Controlo de Disponibilidade */}
        <Cartao className="p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {dados.empresa?.nome ?? "Empresa"}
              </p>
              <h1 className="text-2xl font-extrabold truncate">{dados.condutor.nome}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {LABEL_VEICULO[dados.camiao.tipo] ?? dados.camiao.tipo} · {dados.camiao.matricula}
              </p>
            </div>
            <div className="text-right">
              <Etiqueta cor={activo ? "azul" : estaDisponivel ? "verde" : "cinza"}>
                {estadoTexto}
              </Etiqueta>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 tabular-nums">
                ★ {dados.media ? dados.media.toFixed(1) : "—"} ({dados.totalAvaliacoes})
              </p>
            </div>
          </div>

          {/* Controlo explícito de disponibilidade */}
          {!activo && (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111A2E] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  Estado de disponibilidade
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {estaDisponivel
                    ? `Localização partilhada${
                        dados.camiao.localizacaoActualizadaEm
                          ? ` · actualizada às ${new Date(dados.camiao.localizacaoActualizadaEm).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                          : ""
                      }`
                    : gpsEstado === "granted" || gpsDispositivo
                      ? "GPS autorizado. Active para aparecer nas pesquisas dos clientes."
                      : "Autorize o acesso à localização e active para aparecer nas pesquisas."}
                </p>
                {!estaDisponivel && gpsEstado !== "granted" && !gpsDispositivo && (
                  <button
                    type="button"
                    onClick={() => setGatilhoGps((n) => n + 1)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-primary-400 hover:underline pt-0.5"
                  >
                    📍 Autorizar acesso à localização agora
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={aAlternarDisp || !dados.podeOperar || estaDisponivel}
                  onClick={() => alternarDisponibilidade(true)}
                  className={`min-h-[44px] px-4 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
                    estaDisponivel
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-primary-400 text-slate-950 hover:bg-primary-300"
                  }`}
                >
                  {aAlternarDisp && !estaDisponivel ? "A obter GPS…" : "Disponível para serviços"}
                </button>
                <button
                  type="button"
                  disabled={aAlternarDisp || !dados.camiao.disponivel}
                  onClick={() => alternarDisponibilidade(false)}
                  className={`min-h-[44px] px-4 rounded-xl text-xs font-bold border transition cursor-pointer disabled:opacity-50 ${
                    !estaDisponivel
                      ? "border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 text-slate-900 dark:text-white"
                      : "border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10"
                  }`}
                >
                  Indisponível
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-white/10 text-center">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Concluídos hoje</p>
              <p className="text-xl font-extrabold tabular-nums">{dados.hoje.concluidos}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Receita hoje</p>
              <p className="text-sm font-extrabold text-amber-700 dark:text-primary-400 tabular-nums">
                {faixaPrecoTexto(dados.hoje.receitaMin, dados.hoje.receitaMax)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Solicitações</p>
              <p className="text-xl font-extrabold tabular-nums">{dados.disponiveis.length}</p>
            </div>
          </div>
        </Cartao>

        <AvisoErro>{erroGps || erroMsg}</AvisoErro>

        {/* Serviço em execução */}
        {activo ? (
          <Cartao className="overflow-hidden">
            <div className="relative h-56">
              <Mapa
                centro={centro}
                zoom={13}
                marcadores={marcadores}
                linha={linhaServico}
                encaixarEm
                escuro={tema === "escuro"}
                className="absolute inset-0"
              />
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-extrabold text-lg">Serviço em execução</h2>
                <Etiqueta cor="azul">{LABEL_ESTADO[activo.estado]}</Etiqueta>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex gap-2.5">
                  <span className="text-primary-500 shrink-0">📍</span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Recolha</p>
                    <p className="font-semibold">{activo.origemEndereco}</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <span className="text-emerald-500 shrink-0">🏁</span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Destino</p>
                    <p className="font-semibold">
                      {activo.destinoEndereco || "Não indicado pelo cliente"}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {LABEL_PROBLEMA[activo.tipoProblema] ?? activo.tipoProblema} ·{" "}
                  {LABEL_VEICULO[activo.tipoVeiculo] ?? activo.tipoVeiculo} ·{" "}
                  {activo.distanciaAteRecolhaKm !== null
                    ? `${formatarKm(activo.distanciaAteRecolhaKm)} até recolha`
                    : formatarKm(activo.distanciaKm)}{" "}
                  · {faixaPrecoTexto(activo.precoMin, activo.precoMax)}
                </p>
                {activo.observacoes && (
                  <p className="text-xs rounded-xl bg-slate-100 dark:bg-white/[0.05] px-3 py-2">
                    {activo.observacoes}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={`tel:${activo.cliente.telefone}`}
                  className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-white/15 font-semibold text-sm"
                >
                  📞 Ligar a {activo.cliente.nome} ({formatarTelefone(activo.cliente.telefone)})
                </a>
                {proximo && (
                  <Botao className="flex-1" onClick={avancar} disabled={aProcessar}>
                    {aProcessar ? "A guardar…" : `Marcar: ${LABEL_ESTADO[proximo]}`}
                  </Botao>
                )}
              </div>
            </div>
          </Cartao>
        ) : !dados.podeOperar ? (
          <Cartao className="p-6 space-y-2">
            <h2 className="font-extrabold">Conta não autorizada para serviços</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {dados.empresa?.estadoAprovacao !== "APROVADA"
                ? "A empresa ainda não foi aprovada pelo administrador."
                : !dados.camiao.activo
                  ? "O seu camião está marcado como inactivo. Peça à empresa para o activar."
                  : "A empresa precisa de ter o consentimento de publicação válido."}
            </p>
          </Cartao>
        ) : !estaDisponivel ? (
          <Cartao className="p-8 text-center space-y-3">
            <h2 className="font-extrabold text-lg">Estás indisponível</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Estás indisponível para receber serviços. Activa a disponibilidade para apareceres nas pesquisas.
            </p>
            <div className="pt-1 flex justify-center gap-3">
              <Botao onClick={() => alternarDisponibilidade(true)} disabled={aAlternarDisp}>
                {aAlternarDisp ? "A obter GPS…" : "Activar disponibilidade"}
              </Botao>
              <Link
                href="/condutor/historico"
                className="inline-flex items-center px-4 min-h-[44px] rounded-xl border border-slate-200 dark:border-white/15 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/[0.05]"
              >
                Ver histórico
              </Link>
            </div>
          </Cartao>
        ) : (
          <div className="space-y-5">
            {/* Mapa com a posição actual partilhada pelo condutor */}
            {coordenadasValidas({ lat: dados.camiao.lat, lng: dados.camiao.lng }) && (
              <Cartao className="overflow-hidden">
                <div className="relative h-44">
                  <Mapa
                    centro={{ lat: dados.camiao.lat, lng: dados.camiao.lng }}
                    zoom={14}
                    marcadores={marcadores}
                    escuro={tema === "escuro"}
                    className="absolute inset-0"
                  />
                </div>
              </Cartao>
            )}

            {dados.disponiveis.length === 0 ? (
              <Cartao className="p-8 text-center space-y-3">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/15 grid place-items-center">
                  <span className="block w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <h2 className="font-extrabold text-lg">Disponível para serviços</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Estás disponível. Quando um cliente solicitar os teus serviços, receberás uma notificação aqui.
                </p>
                <Botao variante="contorno" onClick={carregar}>
                  Actualizar agora
                </Botao>
              </Cartao>
            ) : (
              <section className="rounded-3xl border border-amber-200/80 dark:border-amber-400/15 bg-amber-50/70 dark:bg-[#0F172A] p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-extrabold text-slate-900 dark:text-white">
                    Solicitações recebidas{" "}
                    <span className="ml-1 inline-flex w-6 h-6 items-center justify-center rounded-full bg-primary-400 text-slate-950 text-xs font-bold tabular-nums">
                      {dados.disponiveis.length}
                    </span>
                  </h2>
                  <Link
                    href="/condutor/historico"
                    className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-primary-400"
                  >
                    Histórico →
                  </Link>
                </div>

                {dados.disponiveis.map((p) => (
                  <Cartao key={p.id} className="p-4 border-l-4 border-l-primary-400 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="font-bold text-sm">Recolha: {p.origemEndereco}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Destino: {p.destinoEndereco || "Não indicado pelo cliente"}
                        </p>
                      </div>
                      <span className="shrink-0 bg-amber-500/15 dark:bg-primary-400/15 text-amber-800 dark:text-primary-300 text-sm font-bold px-2.5 py-1 rounded-lg tabular-nums">
                        {faixaPrecoTexto(p.precoMin, p.precoMax)}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <p>
                        👤 <b>{p.cliente.nome}</b> · {p.cliente.telefone}
                      </p>
                      <p>🕒 {formatarDataHora(p.criadoEm)}</p>
                      <p>
                        📍 Distância até recolha:{" "}
                        <b>
                          {p.distanciaAteRecolhaKm !== null
                            ? formatarKm(p.distanciaAteRecolhaKm)
                            : "—"}
                        </b>
                      </p>
                      <p>
                        🔧 {LABEL_PROBLEMA[p.tipoProblema] ?? p.tipoProblema} ·{" "}
                        {LABEL_VEICULO[p.tipoVeiculo] ?? p.tipoVeiculo}
                      </p>
                    </div>

                    {p.observacoes && (
                      <p className="text-xs rounded-xl bg-slate-100 dark:bg-white/[0.05] px-3 py-2 text-slate-700 dark:text-slate-300">
                        {p.observacoes}
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <Botao
                        onClick={() => aceitar(p.id)}
                        disabled={aProcessar}
                        className="flex-1"
                      >
                        {aProcessar ? "A processar…" : "Aceitar solicitação"}
                      </Botao>
                      <Botao
                        variante="contorno"
                        onClick={() => recusar(p.id)}
                        disabled={aProcessar}
                        className="flex-1"
                      >
                        Recusar solicitação
                      </Botao>
                    </div>
                  </Cartao>
                ))}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
