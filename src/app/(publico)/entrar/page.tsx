"use client";

import { Suspense } from "react";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AvisoErro } from "@/components/ui";

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="grid lg:grid-cols-[320px_1fr] rounded-3xl overflow-hidden border border-neutral-200 dark:border-white/10 shadow-card bg-white dark:bg-neutral-900">

        {/* ===== Painel lateral esquerdo ===== */}
        <aside className="bg-neutral-950 text-white p-6 sm:p-8 flex flex-col gap-8">
          {/* Marca */}
          <div>
            <Link href="/" className="flex items-center gap-3" aria-label="ReboqueJá — início">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt=""
                className="w-11 h-11 rounded-xl shadow-[0_0_0_3px_rgba(255,195,0,0.2)]"
              />
              <span className="leading-tight">
                <span className="block font-extrabold text-lg tracking-tight">
                  Reboque<span className="text-primary-400">Já</span>
                </span>
                <span className="block text-[11px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">
                  Assistência na Matola
                </span>
              </span>
            </Link>
          </div>

          {/* Cartões informativos */}
          <nav className="flex flex-col gap-3">
            <ItemLateral
              icone={<IconeCarro className="w-5 h-5" />}
              titulo="Sou condutor"
              descricao="Peça um reboque em minutos"
              activo
            />
            <ItemLateral
              icone={<IconeCamiao className="w-5 h-5" />}
              titulo="Sou empresa"
              descricao="Receba pedidos de serviço"
              href="/registar/empresa"
            />
            <ItemLateral
              icone={<IconePredio className="w-5 h-5" />}
              titulo="Ver empresas"
              descricao="Compare faixas de preço"
              href="/empresas"
            />
          </nav>

          {/* Cartão de dica (contas de teste) */}
          <div className="mt-auto rounded-2xl bg-white/[0.06] border border-white/10 p-4">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-primary-400 uppercase mb-2">
              <IconeEstrela className="w-4 h-4" /> Protótipo académico
            </p>
            <p className="text-xs text-neutral-400 leading-relaxed mb-3">
              Dados fictícios — clique para entrar automaticamente:
            </p>
            <div className="flex flex-col gap-1.5 text-xs text-neutral-300">
              <button
                type="button"
                disabled={aEntrar}
                onClick={() => {
                  setContacto("+258841111111");
                  setSenha("teste123");
                  void entrar("+258841111111", "teste123");
                }}
                className="flex items-center gap-2 text-left rounded-lg px-2.5 py-2 hover:bg-white/[0.06] transition disabled:opacity-50"
              >
                <span>👤</span> <b className="font-semibold">Condutor</b>
                <span className="ml-auto text-neutral-500">teste123</span>
              </button>
              <button
                type="button"
                disabled={aEntrar}
                onClick={() => {
                  setContacto("+258865000001");
                  setSenha("teste123");
                  void entrar("+258865000001", "teste123");
                }}
                className="flex items-center gap-2 text-left rounded-lg px-2.5 py-2 hover:bg-white/[0.06] transition disabled:opacity-50"
              >
                <span>🏢</span> <b className="font-semibold">Empresa</b>
                <span className="ml-auto text-neutral-500">teste123</span>
              </button>
              <button
                type="button"
                disabled={aEntrar}
                onClick={() => {
                  setContacto("admin@reboqueja.co.mz");
                  setSenha("admin123");
                  void entrar("admin@reboqueja.co.mz", "admin123");
                }}
                className="flex items-center gap-2 text-left rounded-lg px-2.5 py-2 hover:bg-white/[0.06] transition disabled:opacity-50"
              >
                <span>🛡️</span> <b className="font-semibold">Admin</b>
                <span className="ml-auto text-neutral-500">admin123</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ===== Painel principal direito ===== */}
        <section className="p-6 sm:p-10 lg:p-12">
          <header className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight">Entrar na plataforma</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5">
              Bem-vindo de volta ·{" "}
              <span className="font-semibold text-primary-600 dark:text-primary-400 uppercase text-xs tracking-wide">
                Cidade da Matola
              </span>
            </p>
          </header>

          <div className="max-w-xl">
            {/* Cartão do formulário */}
            <div className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.03] p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-10 h-10 rounded-xl bg-primary-400/15 text-primary-600 dark:text-primary-400 grid place-items-center">
                  <IconeUtilizador className="w-5 h-5" />
                </span>
                <h2 className="font-bold text-lg">Credenciais</h2>
              </div>

              <form onSubmit={submeter} className="space-y-4">
                <label className="block">
                  <span className="block text-sm font-medium mb-1.5">
                    Telefone ou email <b className="text-red-500">*</b>
                  </span>
                  <input
                    value={contacto}
                    onChange={(e) => setContacto(e.target.value)}
                    placeholder="+258 84 123 4567"
                    autoComplete="username"
                    required
                    className={campo}
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1.5">
                    Palavra-passe <b className="text-red-500">*</b>
                  </span>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className={campo}
                  />
                </label>
                <AvisoErro>{erroMsg}</AvisoErro>
              </form>
            </div>

            {/* Rodapé de acções */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 mt-6">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center sm:text-left">
                Não tem conta?{" "}
                <Link href="/registar" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                  Registe-se
                </Link>
              </p>
              <button
                type="button"
                onClick={submeter}
                disabled={aEntrar}
                className="min-h-[52px] px-8 inline-flex items-center justify-center gap-2 rounded-full bg-primary-400 text-neutral-950 font-bold hover:bg-primary-300 active:scale-[0.99] transition shadow-[0_8px_24px_-8px_rgba(255,195,0,0.6)] disabled:opacity-50 disabled:pointer-events-none"
              >
                {aEntrar ? "A entrar…" : "Entrar"} <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ===== Auxiliares ===== */

const campo =
  "w-full min-h-[48px] px-4 rounded-xl border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30";

function ItemLateral({
  icone,
  titulo,
  descricao,
  href,
  activo = false,
}: {
  icone: React.ReactNode;
  titulo: string;
  descricao: string;
  href?: string;
  activo?: boolean;
}) {
  const corpo = (
    <span
      className={`flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition border ${
        activo
          ? "bg-primary-400 text-neutral-950 border-primary-300 shadow-[0_8px_24px_-10px_rgba(255,195,0,0.7)]"
          : "bg-white/[0.04] border-white/10 text-neutral-200 hover:bg-white/[0.08] hover:border-white/20"
      }`}
    >
      <span
        className={`w-10 h-10 shrink-0 rounded-xl grid place-items-center ${
          activo ? "bg-neutral-950/15 text-neutral-950" : "bg-primary-400/15 text-primary-400"
        }`}
      >
        {icone}
      </span>
      <span className="min-w-0 leading-tight">
        <span className={`block font-bold text-sm ${activo ? "" : "text-white"}`}>{titulo}</span>
        <span className={`block text-xs mt-0.5 ${activo ? "text-neutral-800" : "text-neutral-400"}`}>
          {descricao}
        </span>
      </span>
    </span>
  );
  return href ? (
    <Link href={href} className="block">
      {corpo}
    </Link>
  ) : (
    corpo
  );
}

/* ===== Ícones ===== */

type P = React.SVGProps<SVGSVGElement>;
const svg = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconeCarro(p: P) {
  return (<svg {...svg} {...p}><path d="M5 17h14v-4l-2-5H7l-2 5v4Z" /><path d="M5 13h14" /><circle cx="8" cy="17" r="1.5" /><circle cx="16" cy="17" r="1.5" /></svg>);
}
function IconeCamiao(p: P) {
  return (<svg {...svg} {...p}><path d="M2 16V6h11v10" /><path d="M13 9h4l4 4v3h-8" /><circle cx="7" cy="17.5" r="2" /><circle cx="17" cy="17.5" r="2" /></svg>);
}
function IconePredio(p: P) {
  return (<svg {...svg} {...p}><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M9 7h1.5M13.5 7H15M9 11h1.5M13.5 11H15M9 15h1.5M13.5 15H15" /><path d="M10.5 21v-3h3v3" /></svg>);
}
function IconeEstrela(p: P) {
  return (<svg {...svg} fill="currentColor" stroke="none" {...p}><path d="m12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.9 6.4 20l1.3-6.2L3 9.5l6.3-.7L12 3Z" /></svg>);
}
function IconeUtilizador(p: P) {
  return (<svg {...svg} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>);
}
