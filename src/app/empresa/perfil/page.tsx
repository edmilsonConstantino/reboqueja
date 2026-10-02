"use client";

import { useEffect, useState } from "react";
import { Botao, Cartao, Entrada, Etiqueta, AvisoErro, Carregando, Vazio, SairBotao } from "@/components/ui-extra";
import { formatarData } from "@/lib/format";

type Empresa = {
  id: string;
  nome: string;
  nuit: string;
  telefone: string;
  email: string;
  endereco: string;
  raioKm: number;
  disponivel: boolean;
  estadoAprovacao: string;
  consentimentoEm: string | null;
  camioes: { id: string }[];
};

export default function PerfilEmpresa() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [raioKm, setRaioKm] = useState("15");
  const [erroMsg, setErroMsg] = useState("");
  const [gravado, setGravado] = useState(false);
  const [aGravar, setAGravar] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/empresa/perfil", { cache: "no-store" });
      const d = await res.json();
      if (res.ok) {
        setEmpresa(d.empresa);
        setTelefone(d.empresa.telefone);
        setEmail(d.empresa.email);
        setEndereco(d.empresa.endereco);
        setRaioKm(String(d.empresa.raioKm));
      }
    })();
  }, []);

  const gravar = async () => {
    setAGravar(true);
    setErroMsg("");
    setGravado(false);
    try {
      const res = await fetch("/api/empresa/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefone,
          email,
          endereco,
          raioKm: parseFloat(raioKm) || 15,
        }),
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

  if (!empresa) return <div className="p-6"><Carregando /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-extrabold">Perfil da empresa</h1>

      {/* Estado */}
      <Cartao className="p-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Etiqueta
            cor={
              empresa.estadoAprovacao === "APROVADA"
                ? "verde"
                : empresa.estadoAprovacao === "PENDENTE"
                ? "amarelo"
                : "vermelho"
            }
          >
            {empresa.estadoAprovacao}
          </Etiqueta>
          <Etiqueta cor={empresa.disponivel ? "verde" : "cinza"}>
            {empresa.disponivel ? "Disponível" : "Indisponível"}
          </Etiqueta>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {empresa.camioes.length} camião(ões) registados
          </span>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Consentimento de publicação:{" "}
          <b>
            {empresa.consentimentoEm
              ? `dados autorizados a ${formatarData(empresa.consentimentoEm)}`
              : "não autorizado"}
          </b>
        </p>
        {empresa.estadoAprovacao === "PENDENTE" && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            O administrador está a analisar o seu registo. Depois da aprovação, o
            nome, contacto e faixas de preço ficam públicos.
          </p>
        )}
      </Cartao>

      {/* Dados (só leitura) */}
      <Cartao className="p-4 space-y-1 text-sm">
        <p><span className="text-neutral-500">Nome:</span> <b>{empresa.nome}</b></p>
        <p><span className="text-neutral-500">NUIT:</span> {empresa.nuit}</p>
      </Cartao>

      {/* Editáveis */}
      <Cartao className="p-4 space-y-4">
        <h2 className="font-bold">Dados de contacto</h2>
        <Entrada rotulo="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        <Entrada rotulo="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Entrada rotulo="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
        <Entrada
          rotulo="Raio de operação (km)"
          type="number"
          min={1}
          max={50}
          value={raioKm}
          onChange={(e) => setRaioKm(e.target.value)}
        />
        <p className="text-xs text-neutral-500">
          O raio define até que distância da origem o seu serviço é sugerido aos
          condutores.
        </p>
        <AvisoErro>{erroMsg}</AvisoErro>
        {gravado && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-sm rounded-xl px-4 py-3">
            ✅ Dados gravados.
          </div>
        )}
        <Botao className="w-full" onClick={gravar} disabled={aGravar}>
          {aGravar ? "A gravar…" : "Gravar alterações"}
        </Botao>
      </Cartao>

      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <SairBotao />
      </div>
    </div>
  );
}
