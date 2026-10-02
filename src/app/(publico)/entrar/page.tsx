"use client";

import { Suspense } from "react";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Botao, Entrada, AvisoErro, Cartao } from "@/components/ui";

export default function Entrar() {
  return (
    <Suspense>
      <FormularioEntrar />
    </Suspense>
  );
}

function FormularioEntrar() {
  const router = useRouter();
  const params = useSearchParams();
  const [contacto, setContacto] = useState("");
  const [senha, setSenha] = useState("");
  const [erroMsg, setErroMsg] = useState("");
  const [aEntrar, setAEntrar] = useState(false);

  const submeter = async (e: FormEvent) => {
    e.preventDefault();
    setAEntrar(true);
    setErroMsg("");
    try {
      const res = await fetch("/api/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacto, senha }),
      });
      const dados = await res.json();
      if (!res.ok) {
        setErroMsg(dados.erro || "Não foi possível entrar.");
        return;
      }
      const proximo = params.get("proximo");
      const destinos: Record<string, string> = {
        CONDUTOR: "/app",
        EMPRESA: "/empresa",
        ADMIN: "/admin",
      };
      const destino =
        proximo && proximo.startsWith(`/${dados.papel.toLowerCase()}`)
          ? proximo
          : destinos[dados.papel] || "/";
      router.replace(destino);
    } finally {
      setAEntrar(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Cartao className="p-6">
        <h1 className="text-2xl font-extrabold mb-1">Entrar</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          Use o telefone ou email da sua conta.
        </p>
        <form onSubmit={submeter} className="space-y-4">
          <Entrada
            rotulo="Telefone ou email"
            placeholder="+258 84 123 4567"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            autoComplete="username"
            required
          />
          <Entrada
            rotulo="Palavra-passe"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            required
          />
          <AvisoErro>{erroMsg}</AvisoErro>
          <Botao type="submit" disabled={aEntrar} className="w-full">
            {aEntrar ? "A entrar…" : "Entrar"}
          </Botao>
        </form>
        <p className="text-sm text-center mt-5 text-neutral-600 dark:text-neutral-400">
          Não tem conta?{" "}
          <Link href="/registar" className="text-primary-600 font-semibold">
            Registe-se como condutor
          </Link>{" "}
          ou{" "}
          <Link href="/registar/empresa" className="text-primary-600 font-semibold">
            como empresa
          </Link>
        </p>
      </Cartao>

      {/* Credenciais de teste */}
      <Cartao className="p-4 mt-4">
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2">
          Contas de teste (protótipo)
        </p>
        <div className="text-xs space-y-1.5 text-neutral-600 dark:text-neutral-400">
          <p>
            👤 <b>Condutor:</b> +258 84 111 1111 · <code>teste123</code>
          </p>
          <p>
            🏢 <b>Empresa:</b> +258 86 500 0001 · <code>teste123</code>
          </p>
          <p>
            🛡️ <b>Admin:</b> admin@reboqueja.co.mz · <code>admin123</code>
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <button
            type="button"
            onClick={() => {
              setContacto("+258841111111");
              setSenha("teste123");
            }}
            className="text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            Condutor
          </button>
          <button
            type="button"
            onClick={() => {
              setContacto("+258865000001");
              setSenha("teste123");
            }}
            className="text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            Empresa
          </button>
          <button
            type="button"
            onClick={() => {
              setContacto("admin@reboqueja.co.mz");
              setSenha("admin123");
            }}
            className="text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            Admin
          </button>
        </div>
      </Cartao>
    </div>
  );
}
