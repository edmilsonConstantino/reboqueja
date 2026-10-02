"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mapa } from "@/components/Mapa";
import { Botao, Cartao, Etiqueta, Vazio, AvisoErro } from "@/components/ui";
import { faixaPrecoTexto, formatarKm, formatarMinutos } from "@/lib/format";
import { LABEL_PROBLEMA, LABEL_VEICULO } from "@/lib/constants-client";
import { CENTRO_MATOLA } from "@/lib/constants";
import { type LatLng } from "@/lib/geo";

type EmpresaSugerida = {
  id: string;
  nome: string;
  lat: number;
  lng: number;
  media: number | null;
  precoMin: number;
  precoMax: number;
  distanciaKm: number;
  etaMin: number;
  camioesActivos: number;
};

type Rascunho = {
  origemLat: number;
  origemLng: number;
  origemEndereco: string;
  destinoLat: number;
  destinoLng: number;
  destinoEndereco: string;
  tipoProblema: string;
  tipoVeiculo: string;
  observacoes?: string | null;
};

export default function NovoPedido() {
  const router = useRouter();
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [empresas, setEmpresas] = useState<EmpresaSugerida[]>([]);
  const [aCarregar, setACarregar] = useState(true);
  const [erroMsg, setErroMsg] = useState("");
  const [aEnviar, setAEnviar] = useState<string | null>(null);
  const [procuraDecorrida, setProcuraDecorrida] = useState(0);
  const iniciou = useRef(false);

  useEffect(() => {
    if (iniciou.current) return;
    iniciou.current = true;

    const bruto = sessionStorage.getItem("rj-rascunho");
    if (!bruto) {
      router.replace("/app");
      return;
    }
    const r = JSON.parse(bruto) as Rascunho;
    setRascunho(r);

    (async () => {
      try {
        const res = await fetch(
          `/api/pedidos?origemLat=${r.origemLat}&origemLng=${r.origemLng}&tipoVeiculo=${r.tipoVeiculo}`
        );
        const d = await res.json();
        if (!res.ok) {
          setErroMsg(d.erro || "Erro ao procurar empresas.");
          setACarregar(false);
          return;
        }
        setEmpresas(d.empresas || []);
      } catch {
        setErroMsg("Erro de rede ao procurar empresas.");
      } finally {
        setACarregar(false);
      }
    })();
  }, [router]);

  // Cronómetro da animação de procura
  useEffect(() => {
    if (!aCarregar) return;
    const i = setInterval(() => setProcuraDecorrida((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [aCarregar]);

  const criarPedido = async (empresaId: string | null) => {
    if (!rascunho) return;
    setAEnviar(empresaId || "auto");
    setErroMsg("");
    try {
      // "Mais próxima automaticamente" usa a primeira da lista (ordenada por ETA)
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rascunho),
      });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Não foi possível criar o pedido.");
        setAEnviar(null);
        return;
      }
      sessionStorage.removeItem("rj-rascunho");
      router.push(`/app/pedido/${d.id}`);
    } finally {
      setAEnviar(null);
    }
  };

  if (!rascunho) {
    return (
      <div className="p-6">
        <Vazio
          titulo="Sem dados do pedido"
          descricao="Volte ao ecrã principal para marcar o local e o destino."
          accao={<Botao onClick={() => router.push("/app")}>Voltar</Botao>}
        />
      </div>
    );
  }

  const origem: LatLng = { lat: rascunho.origemLat, lng: rascunho.origemLng };
  const destino: LatLng = { lat: rascunho.destinoLat, lng: rascunho.destinoLng };

  return (
    <div className="fixed inset-0 pt-14 pb-[340px]">
      {/* Mapa com origem, destino e sugestões */}
      <Mapa
        centro={origem}
        zoom={13}
        marcadores={[
          { id: "o", pos: origem, emoji: "🚗", cor: "#FFC300" },
          { id: "d", pos: destino, emoji: "🏁", cor: "#10B981" },
          ...empresas.slice(0, 6).map((e) => ({
            id: e.id,
            pos: { lat: e.lat, lng: e.lng },
            emoji: "🚚",
            cor: "#0EA5E9",
          })),
        ]}
        linha={[origem, destino]}
        encaixarEm
        className="absolute inset-0"
      />

      {/* Painel de escolha (desktop: lateral; mobile: inferior fixo) */}
      <div className="absolute z-30 inset-x-0 bottom-0 top-auto md:inset-y-0 md:left-[400px] md:right-auto md:w-[400px] md:top-14 max-h-[62vh] md:max-h-none overflow-y-auto bg-white dark:bg-neutral-900 md:shadow-none shadow-sheet rounded-t-3xl md:rounded-none border-t md:border-t-0 md:border-r border-neutral-200 dark:border-neutral-800 p-4">
        <button
          onClick={() => router.push("/app")}
          className="text-sm text-neutral-500 mb-3 hover:underline"
        >
          ← Editar detalhes
        </button>

        <h1 className="text-lg font-extrabold mb-1">Empresas disponíveis</h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          {LABEL_PROBLEMA[rascunho.tipoProblema]} ·{" "}
          {LABEL_VEICULO[rascunho.tipoVeiculo]}
        </p>

        {aCarregar ? (
          <div className="py-10 text-center">
            {/* Animação radar */}
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-primary-400/30 rj-radar" />
              <div className="absolute inset-0 rounded-full bg-primary-400/20 rj-radar" style={{ animationDelay: "0.5s" }} />
              <div className="absolute inset-4 rounded-full bg-primary-400/40 rj-radar" style={{ animationDelay: "0.9s" }} />
              <div className="absolute inset-0 grid place-items-center text-3xl">🛻</div>
            </div>
            <p className="font-bold">A procurar empresas…</p>
            <p className="text-xs text-neutral-500 mt-1">
              {procuraDecorrida}s · a verificar disponibilidade e preços
            </p>
          </div>
        ) : erroMsg ? (
          <>
            <AvisoErro>{erroMsg}</AvisoErro>
            <Botao variante="contorno" className="w-full mt-3" onClick={() => router.push("/app")}>
              Ajustar pedido
            </Botao>
          </>
        ) : empresas.length === 0 ? (
          <Vazio
            titulo="Nenhuma empresa disponível agora"
            descricao="Todas as empresas aprovadas estão indisponíveis ou fora do raio. Tente mais tarde."
            accao={
              <Botao variante="contorno" onClick={() => router.push("/app")}>
                Voltar
              </Botao>
            }
          />
        ) : (
          <>
            {/* Mais próxima automaticamente */}
            <button
              onClick={() => criarPedido(null)}
              disabled={!!aEnviar}
              className="w-full mb-3 p-4 rounded-2xl bg-primary-400 text-neutral-900 text-left shadow-card hover:bg-primary-300 transition disabled:opacity-60"
            >
              <p className="font-extrabold text-sm">
                ⚡ Mais próxima automaticamente
              </p>
              <p className="text-xs mt-0.5">
                {empresas[0].nome} · {formatarMinutos(empresas[0].etaMin)} ·{" "}
                {faixaPrecoTexto(empresas[0].precoMin, empresas[0].precoMax)}
              </p>
              {aEnviar === "auto" && <p className="text-xs mt-1 font-bold">A criar pedido…</p>}
            </button>

            <div className="space-y-3">
              {empresas.map((e) => (
                <Cartao key={e.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold truncate">{e.nome}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        ★ {e.media ? e.media.toFixed(1) : "—"} ·{" "}
                        {e.camioesActivos} camião(ões) activos
                      </p>
                    </div>
                    <Etiqueta cor="azul">{formatarMinutos(e.etaMin)}</Etiqueta>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <span className="font-extrabold text-primary-600 dark:text-primary-400">
                      {faixaPrecoTexto(e.precoMin, e.precoMax)}
                    </span>
                    <span className="text-xs text-neutral-500">
                      🚚 {formatarKm(e.distanciaKm)} até si
                    </span>
                  </div>
                  <Botao
                    className="w-full mt-3"
                    onClick={() => criarPedido(e.id)}
                    disabled={!!aEnviar}
                  >
                    {aEnviar === e.id ? "A criar pedido…" : "Confirmar pedido"}
                  </Botao>
                </Cartao>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
