"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Botao, Entrada, AvisoErro, Cartao } from "@/components/ui";

export default function RegistarCondutor() {
  const router = useRouter();
  const [form, setForm] = useState({ nome: "", telefone: "", senha: "" });
  const [erroMsg, setErroMsg] = useState("");
  const [aEnviar, setAEnviar] = useState(false);

  const submeter = async (e: FormEvent) => {
    e.preventDefault();
    setAEnviar(true);
    setErroMsg("");
    try {
      const res = await fetch("/api/registar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const dados = await res.json();
      if (!res.ok) {
        setErroMsg(dados.erro || "Não foi possível registar.");
        return;
      }
      router.replace("/app");
    } finally {
      setAEnviar(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Cartao className="p-6">
        <h1 className="text-2xl font-extrabold mb-1">Criar conta de condutor</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          Peça reboque em minutos na Cidade da Matola.
        </p>
        <form onSubmit={submeter} className="space-y-4">
          <Entrada
            rotulo="Nome completo"
            placeholder="Ex.: João Macuácua"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            required
          />
          <Entrada
            rotulo="Telefone"
            placeholder="+258 84 123 4567"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            required
          />
          <Entrada
            rotulo="Palavra-passe"
            type="password"
            placeholder="Mínimo 4 caracteres"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            required
          />
          <AvisoErro>{erroMsg}</AvisoErro>
          <Botao type="submit" disabled={aEnviar} className="w-full">
            {aEnviar ? "A criar conta…" : "Criar conta"}
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
