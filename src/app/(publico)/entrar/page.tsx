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

  const entrar = async (c: string, s: string) => {
    setAEntrar(true);
    setErroMsg("");
    try {
      const res = await fetch("/api/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacto: c, senha: s }),
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
        proximo && destinos[dados.papel] && proximo.startsWith(destinos[dados.papel])
          ? proximo
          : destinos[dados.papel] || "/";
      router.replace(destino);
    } finally {
      setAEntrar(false);
    }
  };

  const submeter = async (e: FormEvent) => {
    e.preventDefault();
    await entrar(contacto, senha);
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

      {/* Credenciais de teste: clicar entra automaticamente */}
      <Cartao className="p-4 mt-4">
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2">
          Contas de teste (protótipo)
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
          Clique num botão para entrar automaticamente:
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
          {[
            { rotulo: "Condutor", contacto: "+258841111111", senha: "teste123" },
            { rotulo: "Empresa", contacto: "+258865000001", senha: "teste123" },
            { rotulo: "Admin", contacto: "admin@reboqueja.co.mz", senha: "admin123" },
          ].map((conta) => (
            <button
              key={conta.rotulo}
              type="button"
              disabled={aEntrar}
              onClick={() => {
                setContacto(conta.contacto);
                setSenha(conta.senha);
                void entrar(conta.contacto, conta.senha);
              }}
              className="text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aEntrar ? "A entrar…" : conta.rotulo}
            </button>
          ))}
        </div>
      </Cartao>
    </div>
  );
}
