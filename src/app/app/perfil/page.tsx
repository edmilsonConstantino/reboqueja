"use client";

import { useEffect, useState } from "react";
import { Botao, Cartao, Entrada, AvisoErro, Selector, SairBotao } from "@/components/ui-extra";
import { LABEL_VEICULO } from "@/lib/constants-client";

type Veiculo = {
  id?: string;
  marca: string;
  modelo: string;
  matricula: string;
  tipo: string;
};

export default function PerfilCondutor() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [erroMsg, setErroMsg] = useState("");
  const [gravado, setGravado] = useState(false);
  const [aGravar, setAGravar] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/minha-conta/perfil", { cache: "no-store" });
      const d = await res.json();
      if (res.ok) {
        setNome(d.utilizador.nome);
        setTelefone(d.utilizador.telefone);
        setVeiculos(d.utilizador.veiculos || []);
      }
    })();
  }, []);

  const actualizarVeiculo = (i: number, campo: keyof Veiculo, valor: string) => {
    setVeiculos((vs) => vs.map((v, idx) => (idx === i ? { ...v, [campo]: valor } : v)));
  };

  const gravar = async () => {
    setAGravar(true);
    setErroMsg("");
    setGravado(false);
    try {
      const res = await fetch("/api/minha-conta/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, veiculos }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Erro ao gravar.");
        return;
      }
      setGravado(true);
      setTimeout(() => setGravado(false), 2500);
    } finally {
      setAGravar(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-extrabold">O meu perfil</h1>

      <Cartao className="p-4 space-y-4">
        <Entrada rotulo="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} />
        <Entrada rotulo="Telefone" value={telefone} disabled />
      </Cartao>

      <Cartao className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">Os meus veículos</h2>
          <button
            className="text-sm font-semibold text-primary-600"
            onClick={() => setVeiculos([...veiculos, { marca: "", modelo: "", matricula: "", tipo: "LIGEIRO" }])}
            disabled={veiculos.length >= 5}
          >
            + Adicionar
          </button>
        </div>
        {veiculos.length === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Ainda não tem veículos guardados. Adicione o primeiro para acelerar os pedidos.
          </p>
        )}
        <div className="space-y-4">
          {veiculos.map((v, i) => (
            <div key={i} className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Entrada rotulo="Marca" value={v.marca} onChange={(e) => actualizarVeiculo(i, "marca", e.target.value)} placeholder="Toyota" />
                <Entrada rotulo="Modelo" value={v.modelo} onChange={(e) => actualizarVeiculo(i, "modelo", e.target.value)} placeholder="Corolla" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Entrada rotulo="Matrícula" value={v.matricula} onChange={(e) => actualizarVeiculo(i, "matricula", e.target.value)} placeholder="ABM-123-MC" />
                <Selector rotulo="Tipo" value={v.tipo} onChange={(e) => actualizarVeiculo(i, "tipo", e.target.value)}>
                  {Object.entries(LABEL_VEICULO).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Selector>
              </div>
              <button
                className="text-xs text-red-600 font-semibold"
                onClick={() => setVeiculos(veiculos.filter((_, idx) => idx !== i))}
              >
                Remover veículo
              </button>
            </div>
          ))}
        </div>
      </Cartao>

      <AvisoErro>{erroMsg}</AvisoErro>
      {gravado && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-sm rounded-xl px-4 py-3">
          ✅ Dados gravados.
        </div>
      )}
      <Botao className="w-full" onClick={gravar} disabled={aGravar}>
        {aGravar ? "A gravar…" : "Gravar dados"}
      </Botao>

      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <SairBotao />
      </div>
    </div>
  );
}
