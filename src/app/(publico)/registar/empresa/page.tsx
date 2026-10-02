"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Botao, Entrada, AvisoErro, Cartao } from "@/components/ui";
import { BAIRROS_MATOLA } from "@/lib/constants";

export default function RegistarEmpresa() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    nuit: "",
    telefone: "",
    email: "",
    endereco: "",
    bairro: "Machava",
    senha: "",
  });
  const [consentimento, setConsentimento] = useState(false);
  const [erroMsg, setErroMsg] = useState("");
  const [aEnviar, setAEnviar] = useState(false);

  const submeter = async (e: FormEvent) => {
    e.preventDefault();
    if (!consentimento) {
      setErroMsg("É necessário aceitar os termos de publicação.");
      return;
    }
    setAEnviar(true);
    setErroMsg("");
    try {
      const res = await fetch("/api/registar/empresa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, consentimento }),
      });
      const dados = await res.json();
      if (!res.ok) {
        setErroMsg(dados.erro || "Não foi possível registar a empresa.");
        return;
      }
      router.replace("/empresa");
    } finally {
      setAEnviar(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Cartao className="p-6">
        <h1 className="text-2xl font-extrabold mb-1">
          Registar empresa de reboque
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          Depois do registo, o administrador aprova a empresa e os seus dados
          tornam-se públicos.
        </p>
        <form onSubmit={submeter} className="space-y-4">
          <Entrada
            rotulo="Nome da empresa"
            placeholder="Ex.: Reboque Machava Lda"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            required
          />
          <Entrada
            rotulo="NUIT"
            placeholder="9 dígitos"
            value={form.nuit}
            onChange={(e) => setForm({ ...form, nuit: e.target.value })}
            required
          />
          <Entrada
            rotulo="Telefone"
            placeholder="+258 86 500 0000"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            required
          />
          <Entrada
            rotulo="Email"
            type="email"
            placeholder="geral@empresa.co.mz"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Entrada
            rotulo="Endereço (sede)"
            placeholder="Av. das FPLM, n.º 120"
            value={form.endereco}
            onChange={(e) => setForm({ ...form, endereco: e.target.value })}
            required
          />
          <label className="block">
            <span className="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">
              Bairro de operação
            </span>
            <select
              className="w-full min-h-[48px] px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
              value={form.bairro}
              onChange={(e) => setForm({ ...form, bairro: e.target.value })}
            >
              {BAIRROS_MATOLA.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <Entrada
            rotulo="Palavra-passe"
            type="password"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            required
          />

          {/* Consentimento */}
          <label className="flex gap-3 items-start bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-900 rounded-xl p-4 cursor-pointer">
            <input
              type="checkbox"
              checked={consentimento}
              onChange={(e) => setConsentimento(e.target.checked)}
              className="mt-1 w-5 h-5 accent-primary-500"
            />
            <span className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
              Autorizo o ReboqueJá a publicar publicamente o <b>nome</b>, o{" "}
              <b>contacto</b> e as <b>faixas de preço</b> desta empresa, e
              aceito os{" "}
              <Link href="/termos" className="underline font-semibold">
                termos de uso e privacidade
              </Link>
              . Esta autorização fica registada com a data de hoje.
            </span>
          </label>

          <AvisoErro>{erroMsg}</AvisoErro>
          <Botao type="submit" disabled={aEnviar} className="w-full">
            {aEnviar ? "A registar…" : "Registar empresa"}
          </Botao>
        </form>
        <p className="text-sm text-center mt-5 text-neutral-600 dark:text-neutral-400">
          Já tem conta?{" "}
          <Link href="/entrar" className="text-primary-600 font-semibold">
            Entrar
          </Link>
        </p>
      </Cartao>
    </div>
  );
}
