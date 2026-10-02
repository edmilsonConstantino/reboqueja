"use client";

import { useEffect, useState } from "react";
import { Botao, Cartao, Entrada, AvisoErro, Selector, Carregando } from "@/components/ui";
import { LABEL_VEICULO } from "@/lib/constants-client";
import { INTERVALOS_KM, TIPOS_VEICULO } from "@/lib/constants";

type Faixa = {
  id: string;
  tipoVeiculo: string;
  kmMin: number;
  kmMax: number;
  precoMin: number;
  precoMax: number;
};

export default function Precos() {
  const [faixas, setFaixas] = useState<Faixa[] | null>(null);
  const [tipoVeiculo, setTipoVeiculo] = useState("LIGEIRO");
  const [intervaloIdx, setIntervaloIdx] = useState(0);
  const [precoMin, setPrecoMin] = useState("500");
  const [precoMax, setPrecoMax] = useState("1000");
  const [erroMsg, setErroMsg] = useState("");
  const [aSalvar, setASalvar] = useState(false);

  const carregar = async () => {
    const res = await fetch("/api/empresa/precos", { cache: "no-store" });
    const d = await res.json();
    setFaixas(d.precos || []);
  };

  useEffect(() => {
    carregar();
  }, []);

  const gravar = async () => {
    setASalvar(true);
    setErroMsg("");
    const intervalo = INTERVALOS_KM[intervaloIdx];
    try {
      const res = await fetch("/api/empresa/precos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoVeiculo,
          kmMin: intervalo.kmMin,
          kmMax: intervalo.kmMax,
          precoMin: parseInt(precoMin) || 0,
          precoMax: parseInt(precoMax) || 0,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Erro ao gravar a faixa.");
        return;
      }
      await carregar();
    } finally {
      setASalvar(false);
    }
  };

  const eliminar = async (id: string) => {
    await fetch(`/api/empresa/precos?id=${id}`, { method: "DELETE" });
    await carregar();
  };

  if (!faixas) return <div className="p-6"><Carregando /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Faixas de preço</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Defina o intervalo mínimo–máximo em MT para cada tipo de veículo e
          distância. O condutor vê sempre uma faixa, nunca um valor fixo.
        </p>
      </div>

      <Cartao className="p-4 space-y-3">
        <h2 className="font-bold">Definir faixa</h2>
        <div className="grid grid-cols-2 gap-3">
          <Selector rotulo="Tipo de veículo" value={tipoVeiculo} onChange={(e) => setTipoVeiculo(e.target.value)}>
            {TIPOS_VEICULO.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Selector>
          <Selector
            rotulo="Intervalo de distância"
            value={String(intervaloIdx)}
            onChange={(e) => setIntervaloIdx(Number(e.target.value))}
          >
            {INTERVALOS_KM.map((i, idx) => (
              <option key={i.label} value={idx}>{i.label}</option>
            ))}
          </Selector>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Entrada rotulo="Preço mínimo (MT)" type="number" min={100} value={precoMin} onChange={(e) => setPrecoMin(e.target.value)} />
          <Entrada rotulo="Preço máximo (MT)" type="number" min={100} value={precoMax} onChange={(e) => setPrecoMax(e.target.value)} />
        </div>
        <AvisoErro>{erroMsg}</AvisoErro>
        <Botao className="w-full" onClick={gravar} disabled={aSalvar}>
          {aSalvar ? "A gravar…" : "Gravar faixa"}
        </Botao>
      </Cartao>

      {/* Tabela das faixas existentes */}
      <div className="space-y-4">
        {TIPOS_VEICULO.map((t) => {
          const doTipo = faixas
            .filter((f) => f.tipoVeiculo === t.value)
            .sort((a, b) => a.kmMin - b.kmMin);
          if (doTipo.length === 0) return null;
          return (
            <Cartao key={t.value} className="p-4">
              <h3 className="font-bold mb-3">{t.label}</h3>
              <div className="space-y-2">
                {doTipo.map((f) => (
                  <div key={f.id} className="flex items-center justify-between text-sm border-b border-neutral-100 dark:border-neutral-800 pb-2 last:border-0 last:pb-0">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {f.kmMax >= 9999 ? "Mais de 20 km" : `${f.kmMin}–${f.kmMax} km`}
                    </span>
                    <span className="flex items-center gap-3">
                      <b>{f.precoMin} – {f.precoMax} MT</b>
                      <button className="text-red-500 text-xs font-semibold" onClick={() => eliminar(f.id)}>
                        eliminar
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </Cartao>
          );
        })}
        {faixas.length === 0 && (
          <Cartao className="p-4 text-sm text-neutral-500">
            Ainda não definiu faixas. Sem faixas de preço, a empresa não aparece
            nas sugestões aos condutores.
          </Cartao>
        )}
      </div>
    </div>
  );
}
