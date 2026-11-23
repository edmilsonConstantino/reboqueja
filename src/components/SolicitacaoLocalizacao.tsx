"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, MapPin, Navigation, RefreshCw, ShieldCheck, X } from "lucide-react";
import { usarTema } from "@/components/ProvedorTema";

export type EstadoPermissaoGps = "checking" | "prompt" | "granted" | "denied" | "indisponivel";

type Props = {
  perfil: "CLIENTE" | "CONDUTOR";
  /** Se true, não apresenta o modal automaticamente (ex.: cliente já tem pedido activo em acompanhamento). */
  suprimirAutomatico?: boolean;
  /** Callback chamado sempre que coordenadas reais são obtidas do dispositivo. */
  aoObterLocalizacao: (pos: { lat: number; lng: number }) => void;
  /** Callback opcional para informar o estado actual da permissão de GPS. */
  aoAlterarEstado?: (estado: EstadoPermissaoGps) => void;
  /** Incrementar para reabrir o pedido de localização manualmente. */
  gatilhoAbrir?: number;
};

const CHAVE_DISPENSADO = "rj-gps-prompt-dispensado";

export function SolicitacaoLocalizacao({
  perfil,
  suprimirAutomatico = false,
  aoObterLocalizacao,
  aoAlterarEstado,
  gatilhoAbrir = 0,
}: Props) {
  const { tema } = usarTema();
  const [aberto, setAberto] = useState(false);
  const [estado, setEstado] = useState<EstadoPermissaoGps>("checking");
  const [aCarregar, setACarregar] = useState(false);
  const [erroDetalhe, setErroDetalhe] = useState("");
  const [sucessoBreve, setSucessoBreve] = useState(false);

  const aoObterRef = useRef(aoObterLocalizacao);
  const aoAlterarRef = useRef(aoAlterarEstado);
  const iniciadoRef = useRef(false);

  useEffect(() => {
    aoObterRef.current = aoObterLocalizacao;
  }, [aoObterLocalizacao]);

  useEffect(() => {
    aoAlterarRef.current = aoAlterarEstado;
  }, [aoAlterarEstado]);

  const actualizarEstado = useCallback((novo: EstadoPermissaoGps) => {
    setEstado(novo);
    aoAlterarRef.current?.(novo);
  }, []);

  const pedirLocalizacao = useCallback(
    (origemUsuario: boolean) => {
      if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
        actualizarEstado("indisponivel");
        setErroDetalhe(
          "Este navegador ou dispositivo não suporta partilha automática de localização."
        );
        if (origemUsuario) setAberto(true);
        return;
      }

      setACarregar(true);
      if (origemUsuario) setErroDetalhe("");

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setACarregar(false);
          setErroDetalhe("");
          actualizarEstado("granted");
          try {
            sessionStorage.removeItem(CHAVE_DISPENSADO);
          } catch {}
          aoObterRef.current({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          if (origemUsuario) {
            setSucessoBreve(true);
            setTimeout(() => {
              setSucessoBreve(false);
              setAberto(false);
            }, 650);
          } else {
            setAberto(false);
          }
        },
        (err) => {
          setACarregar(false);
          const msg = (err?.message || "").toLowerCase();
          const bloqueadoPolitica =
            msg.includes("permissions policy") || msg.includes("disabled");

          if (err?.code === 1) {
            if (origemUsuario || bloqueadoPolitica) {
              actualizarEstado("denied");
              setErroDetalhe(
                bloqueadoPolitica
                  ? "O acesso automático à localização está bloqueado nesta janela/navegador. Pode autorizar nas definições ou indicar o local manualmente no mapa."
                  : "A permissão de localização foi recusada. Active a localização nas definições do navegador para este site e tente novamente."
              );
            } else {
              // Tentativa automática inicial bloqueada por requerer toque do utilizador:
              // mantemos o cartão de aprovação limpo sem mostrar erro vermelho imediato.
              actualizarEstado("prompt");
            }
            return;
          }

          if (origemUsuario) {
            setErroDetalhe(
              err?.code === 3
                ? "O pedido de localização demorou demasiado tempo. Tente novamente ou indique o local manualmente."
                : "Não foi possível obter a localização do dispositivo neste momento. Verifique se o GPS está ligado."
            );
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
      );
    },
    [actualizarEstado]
  );

  // Verificação e pedido imediato ao aceder ao sistema
  useEffect(() => {
    if (iniciadoRef.current) return;
    iniciadoRef.current = true;

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      actualizarEstado("indisponivel");
      if (!suprimirAutomatico) setAberto(true);
      return;
    }

    let permStatus: PermissionStatus | null = null;
    let cancelado = false;

    const aoMudarPermissao = () => {
      if (!permStatus || cancelado) return;
      if (permStatus.state === "granted") {
        pedirLocalizacao(false);
      } else if (permStatus.state === "denied") {
        actualizarEstado("denied");
      } else {
        actualizarEstado("prompt");
      }
    };

    const inicializar = async () => {
      let jaDispensado = false;
      try {
        jaDispensado = sessionStorage.getItem(CHAVE_DISPENSADO) === "1";
      } catch {}

      if (navigator.permissions?.query) {
        try {
          permStatus = await navigator.permissions.query({ name: "geolocation" });
          if (cancelado) return;

          permStatus.addEventListener?.("change", aoMudarPermissao);

          if (permStatus.state === "granted") {
            actualizarEstado("granted");
            pedirLocalizacao(false);
            return;
          }

          if (permStatus.state === "denied") {
            actualizarEstado("denied");
            setErroDetalhe(
              "A permissão de localização está desactivada no navegador. Active-a para usar a detecção automática."
            );
            if (!suprimirAutomatico && !jaDispensado) setAberto(true);
            return;
          }

          // Estado "prompt": solicita imediatamente ao entrar no sistema
          actualizarEstado("prompt");
          if (!suprimirAutomatico && !jaDispensado) {
            setAberto(true);
            pedirLocalizacao(false);
          }
          return;
        } catch {
          // Alguns browsers não suportam permissions.query('geolocation')
        }
      }

      actualizarEstado("prompt");
      if (!suprimirAutomatico && !jaDispensado) {
        setAberto(true);
        pedirLocalizacao(false);
      }
    };

    void inicializar();

    return () => {
      cancelado = true;
      permStatus?.removeEventListener?.("change", aoMudarPermissao);
    };
  }, [suprimirAutomatico, actualizarEstado, pedirLocalizacao]);

  // Reabertura explícita a partir de botões da interface
  useEffect(() => {
    if (gatilhoAbrir > 0) {
      setErroDetalhe("");
      setAberto(true);
      pedirLocalizacao(true);
    }
  }, [gatilhoAbrir, pedirLocalizacao]);

  const dispensar = () => {
    try {
      sessionStorage.setItem(CHAVE_DISPENSADO, "1");
    } catch {}
    setAberto(false);
  };

  if (!aberto) return null;

  const titulo =
    estado === "denied" || estado === "indisponivel"
      ? "Localização não autorizada"
      : "Permitir acesso à localização";

  const descricao =
    perfil === "CONDUTOR"
      ? "Para confirmar a sua posição na zona da Matola/Zimpeto, receber solicitações próximas e partilhar a rota durante o serviço, o ReboqueJá precisa de aceder à localização do dispositivo."
      : "Para localizar automaticamente o seu veículo no mapa e encontrar os camiões de reboque mais próximos de si, autorize o acesso à localização do dispositivo.";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-permissao-gps"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
    >
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-4 transition-colors ${
          tema === "escuro"
            ? "bg-[#0E1629] border-white/10 text-slate-100"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`w-12 h-12 rounded-2xl grid place-items-center shrink-0 border ${
                sucessoBreve
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500"
                  : estado === "denied" || estado === "indisponivel"
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-500"
                    : "bg-primary-400/15 border-primary-400/35 text-amber-600 dark:text-primary-400"
              }`}
            >
              {sucessoBreve ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : estado === "denied" || estado === "indisponivel" ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <Navigation className="w-6 h-6" />
              )}
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-primary-400">
                Acesso ao GPS
              </p>
              <h2 id="titulo-permissao-gps" className="text-lg font-extrabold leading-tight">
                {sucessoBreve ? "Localização obtida!" : titulo}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={dispensar}
            aria-label="Fechar pedido de localização"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {descricao}
        </p>

        <div className="rounded-2xl bg-slate-50 dark:bg-[#111A2E] border border-slate-200 dark:border-white/10 p-3 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            {perfil === "CONDUTOR"
              ? "A sua posição só é partilhada para pesquisa quando activar «Disponível para serviços» ou durante um reboque em curso."
              : "A localização é usada apenas para definir o ponto de recolha do seu veículo e calcular distâncias."}
          </span>
        </div>

        {erroDetalhe && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/25 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300">
            {erroDetalhe}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          {estado !== "indisponivel" && (
            <button
              type="button"
              disabled={aCarregar || sucessoBreve}
              onClick={() => pedirLocalizacao(true)}
              className="flex-1 min-h-[48px] px-4 rounded-full bg-primary-400 hover:bg-primary-300 text-slate-950 font-bold text-sm inline-flex items-center justify-center gap-2 transition shadow-[0_8px_20px_-8px_rgba(255,195,0,0.6)] disabled:opacity-60"
            >
              {aCarregar ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> A solicitar GPS…
                </>
              ) : estado === "denied" ? (
                <>
                  <RefreshCw className="w-4 h-4" /> Tentar novamente
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" /> Permitir localização
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={dispensar}
            className="min-h-[48px] px-4 rounded-full border border-slate-300 dark:border-white/15 font-semibold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition"
          >
            {perfil === "CLIENTE" ? "Indicar no mapa" : "Agora não"}
          </button>
        </div>
      </div>
    </div>
  );
}
