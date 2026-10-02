"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mapa } from "@/components/Mapa";
import { BottomSheetArrastavel } from "@/components/BottomSheet";
import { Botao, Entrada, AvisoErro, Selector } from "@/components/ui";
import { CENTRO_MATOLA, TIPOS_PROBLEMA, TIPOS_VEICULO } from "@/lib/constants";
import { estaNaMatola, type LatLng } from "@/lib/geo";

type Paso = "local" | "detalhes";

export default function AppCondutor() {
  const router = useRouter();
  const [pos, setPos] = useState<LatLng>(CENTRO_MATOLA);
  const [origemEndereco, setOrigemEndereco] = useState("A localizar…");
  const [gpsOk, setGpsOk] = useState<boolean | null>(null);
  const [paso, setPaso] = useState<Paso>("local");
  const [erroMsg, setErroMsg] = useState("");
  const [aBuscar, setABuscar] = useState(false);

  // Destino
  const [buscaDestino, setBuscaDestino] = useState("");
  const [resultados, setResultados] = useState<
    { lat: number; lng: number; label: string }[]
  >([]);
  const [destino, setDestino] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);

  // Detalhes
  const [tipoProblema, setTipoProblema] = useState("AVARIA_MECANICA");
  const [tipoVeiculo, setTipoVeiculo] = useState("LIGEIRO");
  const [observacoes, setObservacoes] = useState("");

  const posRef = useRef(pos);
  posRef.current = pos;

  // GPS inicial
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsOk(false);
      setOrigemEndereco("GPS indisponível — toque no mapa para marcar o local");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const p2 = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(p2);
        setGpsOk(estaNaMatola(p2));
        await buscarEndereco(p2);
      },
      () => {
        setGpsOk(false);
        setOrigemEndereco("Sem GPS — toque no mapa para marcar o local");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buscarEndereco = useCallback(async (p: LatLng) => {
    try {
      const res = await fetch(`/api/reverse?lat=${p.lat}&lng=${p.lng}`);
      const d = await res.json();
      setOrigemEndereco(d.label || `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`);
    } catch {
      setOrigemEndereco(`${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`);
    }
  }, []);

  // Pesquisa de destino (com debounce)
  useEffect(() => {
    if (buscaDestino.trim().length < 3) {
      setResultados([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(buscaDestino)}`
        );
        const d = await res.json();
        setResultados(d.resultados || []);
      } catch {
        setResultados([]);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [buscaDestino]);

  const aoClicarMapa = useCallback(
    (p: LatLng) => {
      setPos(p);
      setGpsOk(estaNaMatola(p));
      buscarEndereco(p);
    },
    [buscarEndereco]
  );

  const continuar = () => {
    setErroMsg("");
    if (!estaNaMatola(pos)) {
      setErroMsg(
        "O local do veículo está fora dos limites da Cidade da Matola. O serviço só cobre a Matola."
      );
      return;
    }
    setPaso("detalhes");
  };

  const verEmpresas = () => {
    setErroMsg("");
    if (!destino) {
      setErroMsg("Escolha o destino do reboque.");
      return;
    }
    if (!estaNaMatola(destino)) {
      setErroMsg(
        "O destino está fora dos limites da Cidade da Matola. Escolha um destino dentro da cidade."
      );
      return;
    }
    setABuscar(true);
    // Guarda o rascunho para a página de escolha da empresa
    sessionStorage.setItem(
      "rj-rascunho",
      JSON.stringify({
        origemLat: pos.lat,
        origemLng: pos.lng,
        origemEndereco,
        destinoLat: destino.lat,
        destinoLng: destino.lng,
        destinoEndereco: destino.label,
        tipoProblema,
        tipoVeiculo,
        observacoes,
      })
    );
    router.push("/app/pedido/novo");
  };

  return (
    <div className="fixed inset-0 pt-14">
      {/* Mapa em ecrã inteiro */}
      <Mapa
        centro={pos}
        zoom={14}
        marcadores={[
          {
            id: "origem",
            pos,
            emoji: "🚗",
            pulso: true,
            cor: gpsOk === false ? "#EF4444" : "#FFC300",
          },
        ]}
        aoClicar={aoClicarMapa}
        poligonoMatola
        className="absolute inset-0"
      />

      {/* Aviso fora da Matola */}
      {gpsOk === false && (
        <div className="absolute top-16 left-4 right-4 z-20 bg-red-600 text-white rounded-xl px-4 py-3 text-sm font-semibold shadow-card rj-fade-up">
          ⚠️ Está fora dos limites da Cidade da Matola — o serviço só está
          disponível dentro da cidade.
        </div>
      )}

      {/* Bottom sheet */}
      <BottomSheetArrastavel alturaColapsada={paso === "local" ? 300 : 380}>
        <h1 className="text-xl font-extrabold mb-1">
          {paso === "local" ? "Onde está o veículo?" : "Detalhes do reboque"}
        </h1>

        {paso === "local" ? (
          <div className="space-y-3">
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3 text-sm">
              <span className="text-neutral-500 dark:text-neutral-400 block text-xs mb-0.5">
                Local da avaria (toque no mapa para ajustar)
              </span>
              <span className="font-semibold">{origemEndereco}</span>
            </div>
            {gpsOk === false && (
              <p className="text-xs text-neutral-500">
                Dica: no protótipo pode tocar no mapa dentro da zona amarela da
                Matola para simular a sua posição.
              </p>
            )}
            <AvisoErro>{erroMsg}</AvisoErro>
            <Botao className="w-full" onClick={continuar}>
              Continuar →
            </Botao>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Origem resumida */}
            <button
              className="w-full text-left bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3 text-sm"
              onClick={() => setPaso("local")}
            >
              <span className="text-neutral-500 dark:text-neutral-400 block text-xs">
                De (avaria)
              </span>
              <span className="font-semibold">{origemEndereco}</span>
            </button>

            {/* Destino */}
            {destino ? (
              <button
                className="w-full text-left bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-900 rounded-xl p-3 text-sm"
                onClick={() => {
                  setDestino(null);
                  setBuscaDestino("");
                }}
              >
                <span className="text-neutral-500 dark:text-neutral-400 block text-xs">
                  Para (destino) — toque para mudar
                </span>
                <span className="font-semibold">{destino.label}</span>
              </button>
            ) : (
              <div>
                <Entrada
                  rotulo="Destino: oficina, casa ou outro"
                  placeholder="Ex.: Oficina Auto Geral, Machava"
                  value={buscaDestino}
                  onChange={(e) => setBuscaDestino(e.target.value)}
                />
                {resultados.length > 0 && (
                  <div className="mt-2 border border-neutral-200 dark:border-neutral-700 rounded-xl divide-y divide-neutral-100 dark:divide-neutral-800 max-h-44 overflow-y-auto">
                    {resultados.map((r, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        onClick={() => {
                          setDestino(r);
                          setBuscaDestino(r.label);
                          setResultados([]);
                        }}
                      >
                        📍 {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Selector
                rotulo="Tipo de problema"
                value={tipoProblema}
                onChange={(e) => setTipoProblema(e.target.value)}
              >
                {TIPOS_PROBLEMA.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Selector>
              <Selector
                rotulo="Tipo de veículo"
                value={tipoVeiculo}
                onChange={(e) => setTipoVeiculo(e.target.value)}
              >
                {TIPOS_VEICULO.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Selector>
            </div>

            <Entrada
              rotulo="Observações (opcional)"
              placeholder="Ex.: veículo na berma direita, portão trancado…"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />

            <AvisoErro>{erroMsg}</AvisoErro>
            <Botao
              className="w-full"
              onClick={verEmpresas}
              disabled={aBuscar || !destino}
            >
              {aBuscar ? "A procurar…" : "Ver empresas disponíveis →"}
            </Botao>
          </div>
        )}
      </BottomSheetArrastavel>
    </div>
  );
}
