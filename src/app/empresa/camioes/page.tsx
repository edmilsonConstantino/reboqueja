"use client";

import { useEffect, useState } from "react";
import { Botao, Cartao, Entrada, Etiqueta, AvisoErro, Selector, Carregando } from "@/components/ui";
import { LABEL_VEICULO } from "@/lib/constants-client";
import { TIPOS_VEICULO } from "@/lib/constants";

type Camiao = {
  id: string;
  matricula: string;
  tipo: string;
  capacidade: string | null;
  motoristaNome: string;
  motoristaTelefone: string;
  activo: boolean;
};

const vazio = { matricula: "", tipo: "LIGEIRO", capacidade: "", motoristaNome: "", motoristaTelefone: "", activo: true };

export default function Camioes() {
  const [camioes, setCamioes] = useState<Camiao[] | null>(null);
  const [novo, setNovo] = useState({ ...vazio });
  const [erroMsg, setErroMsg] = useState("");
  const [aSalvar, setASalvar] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [edicao, setEdicao] = useState({ ...vazio });

  const carregar = async () => {
    const res = await fetch("/api/empresa/camioes", { cache: "no-store" });
    const d = await res.json();
    setCamioes(d.camioes || []);
  };

  useEffect(() => {
    carregar();
  }, []);

  const criar = async () => {
    setASalvar(true);
    setErroMsg("");
    try {
      const res = await fetch("/api/empresa/camioes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novo),
      });
      const d = await res.json();
      if (!res.ok) {
        setErroMsg(d.erro || "Erro ao criar camião.");
        return;
      }
      setNovo({ ...vazio });
      await carregar();
    } finally {
      setASalvar(false);
    }
  };

  const gravarEdicao = async (id: string) => {
    setErroMsg("");
    const res = await fetch("/api/empresa/camioes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...edicao }),
    });
    const d = await res.json();
    if (!res.ok) {
      setErroMsg(d.erro || "Erro ao gravar.");
      return;
    }
    setEditando(null);
    await carregar();
  };

  const alternarActivo = async (c: Camiao) => {
    await fetch("/api/empresa/camioes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, activo: !c.activo }),
    });
    await carregar();
  };

  const eliminar = async (id: string) => {
    if (!confirm("Eliminar este camião? Esta acção não pode ser revertida.")) return;
    await fetch(`/api/empresa/camioes?id=${id}`, { method: "DELETE" });
    await carregar();
  };

  if (!camioes) return <div className="p-6"><Carregando /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-2xl font-extrabold">Camiões</h1>

      {/* Novo camião */}
      <Cartao className="p-4 space-y-3">
        <h2 className="font-bold">Adicionar camião</h2>
        <div className="grid grid-cols-2 gap-3">
          <Entrada rotulo="Matrícula" placeholder="RBM-001-MC" value={novo.matricula} onChange={(e) => setNovo({ ...novo, matricula: e.target.value })} />
          <Selector rotulo="Tipo" value={novo.tipo} onChange={(e) => setNovo({ ...novo, tipo: e.target.value })}>
            {TIPOS_VEICULO.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Selector>
        </div>
        <Entrada rotulo="Capacidade (opcional)" placeholder="Ex.: Até 2 t" value={novo.capacidade || ""} onChange={(e) => setNovo({ ...novo, capacidade: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Entrada rotulo="Motorista" placeholder="Nome do motorista" value={novo.motoristaNome} onChange={(e) => setNovo({ ...novo, motoristaNome: e.target.value })} />
          <Entrada rotulo="Telefone do motorista" placeholder="+258 87 000 0000" value={novo.motoristaTelefone} onChange={(e) => setNovo({ ...novo, motoristaTelefone: e.target.value })} />
        </div>
        <AvisoErro>{erroMsg}</AvisoErro>
        <Botao className="w-full" onClick={criar} disabled={aSalvar}>
          {aSalvar ? "A adicionar…" : "+ Adicionar camião"}
        </Botao>
      </Cartao>

      {/* Lista */}
      {camioes.length === 0 ? (
        <Cartao className="p-4 text-sm text-neutral-500">
          Ainda não tem camiões. Adicione o primeiro acima — sem camiões activos a
          empresa não recebe pedidos.
        </Cartao>
      ) : (
        <div className="space-y-3">
          {camioes.map((c) => (
            <Cartao key={c.id} className="p-4">
              {editando === c.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Entrada rotulo="Matrícula" value={edicao.matricula} onChange={(e) => setEdicao({ ...edicao, matricula: e.target.value })} />
                    <Selector rotulo="Tipo" value={edicao.tipo} onChange={(e) => setEdicao({ ...edicao, tipo: e.target.value })}>
                      {TIPOS_VEICULO.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </Selector>
                  </div>
                  <Entrada rotulo="Motorista" value={edicao.motoristaNome} onChange={(e) => setEdicao({ ...edicao, motoristaNome: e.target.value })} />
                  <Entrada rotulo="Telefone" value={edicao.motoristaTelefone} onChange={(e) => setEdicao({ ...edicao, motoristaTelefone: e.target.value })} />
                  <div className="flex gap-2">
                    <Botao className="flex-1" onClick={() => gravarEdicao(c.id)}>Gravar</Botao>
                    <Botao variante="contorno" className="flex-1" onClick={() => setEditando(null)}>Cancelar</Botao>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{c.matricula}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {LABEL_VEICULO[c.tipo] || c.tipo}
                      {c.capacidade ? ` · ${c.capacidade}` : ""}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      👤 {c.motoristaNome} · {c.motoristaTelefone}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => alternarActivo(c)}>
                      <Etiqueta cor={c.activo ? "verde" : "cinza"}>
                        {c.activo ? "Activo" : "Inactivo"}
                      </Etiqueta>
                    </button>
                    <div className="flex gap-1 text-xs font-semibold">
                      <button
                        className="text-primary-600 px-2 py-1"
                        onClick={() => {
                          setEditando(c.id);
                          setEdicao({
                            matricula: c.matricula,
                            tipo: c.tipo,
                            capacidade: c.capacidade || "",
                            motoristaNome: c.motoristaNome,
                            motoristaTelefone: c.motoristaTelefone,
                            activo: c.activo,
                          });
                        }}
                      >
                        Editar
                      </button>
                      <button className="text-red-500 px-2 py-1" onClick={() => eliminar(c.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Cartao>
          ))}
        </div>
      )}
    </div>
  );
}
