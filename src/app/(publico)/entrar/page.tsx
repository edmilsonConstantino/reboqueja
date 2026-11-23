"use client";

import { Suspense } from "react";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const params = useSearchParams();
  // ?tipo=empresa realça a entrada de empresa (ex.: botão "Sou empresa").
  const empresa = params.get("tipo") === "empresa";
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
        credentials: "include",
        body: JSON.stringify({ contacto: c, senha: s }),
      });
      const dados = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErroMsg(dados.erro || "Não foi possível entrar.");
        return;
      }
      const proximo = params.get("proximo");
      const destinos: Record<string, string> = {
        CLIENTE: "/app",
        CONDUTOR: "/condutor",
        EMPRESA: "/empresa",
        ADMIN: "/admin",
      };
      const destino =
        proximo && destinos[dados.papel] && proximo.startsWith(destinos[dados.papel])
          ? proximo
          : destinos[dados.papel] || "/";
      window.location.assign(destino);
    } catch {
      setErroMsg("Não foi possível ligar ao servidor. Tente novamente.");
    } finally {
      setAEntrar(false);
    }
  };

  const submeter = async (e?: FormEvent) => {
    e?.preventDefault();
    await entrar(contacto, senha);
  };

  return (
    <div className="bg-[#FAF7F2] dark:bg-[#0C0603] py-8 sm:py-12 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-[320px_1fr] rounded-3xl overflow-hidden border border-[#E5D6C3] dark:border-[#492C19]/80 shadow-lg dark:shadow-2xl bg-white dark:bg-[#1A0F08]">

          {/* ===== Painel lateral esquerdo ===== */}
          <aside className="order-2 lg:order-1 bg-[#1E1109] dark:bg-[#120A05] text-white p-6 sm:p-8 flex flex-col gap-8 border-t lg:border-t-0 lg:border-r border-[#3A2212]">
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
              titulo="Sou cliente"
              descricao="Peça um reboque em minutos"
              activo={!empresa}
              href={empresa ? "/entrar" : undefined}
            />
            <ItemLateral
              icone={<IconeCamiao className="w-5 h-5" />}
              titulo="Sou empresa"
              descricao="Receba pedidos de serviço"
              activo={empresa}
              href={empresa ? undefined : "/entrar?tipo=empresa"}
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
                <span>👤</span> <b className="font-semibold">Cliente</b>
                <span className="ml-auto text-neutral-500">teste123</span>
              </button>
              <button
                type="button"
                disabled={aEntrar}
                onClick={() => {
                  setContacto("+258875000001");
                  setSenha("teste123");
                  void entrar("+258875000001", "teste123");
                }}
                className="flex items-center gap-2 text-left rounded-lg px-2.5 py-2 hover:bg-white/[0.06] transition disabled:opacity-50"
              >
                <span>🚚</span> <b className="font-semibold">Condutor</b>
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
        <section className="order-1 lg:order-2 p-6 sm:p-10 lg:p-12 bg-white dark:bg-[#1A0F08]">
          <header className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1A100A] dark:text-white">Entrar na plataforma</h1>
            <p className="text-sm text-[#6B5747] dark:text-[#B9A490] mt-1.5">
              Bem-vindo de volta ·{" "}
              <span className="font-semibold text-[#9A4D0D] dark:text-[#F59E0B] uppercase text-xs tracking-wide">
                Cidade da Matola
              </span>
            </p>
          </header>

          <div className="max-w-xl">
            {/* Cartão do formulário */}
            <div className="rounded-2xl border border-[#E5D6C3] dark:border-[#492C19]/80 bg-[#FAF7F2] dark:bg-[#120A05] p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-10 h-10 rounded-xl bg-amber-500/15 dark:bg-primary-400/15 text-amber-700 dark:text-primary-400 grid place-items-center">
                  <IconeUtilizador className="w-5 h-5" />
                </span>
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">Credenciais</h2>
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
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
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
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center sm:text-left">
                Não tem conta?{" "}
                <Link
                  href={empresa ? "/registar/empresa" : "/registar"}
                  className="font-semibold text-amber-700 dark:text-primary-400 hover:underline"
                >
                  Registe-se
                </Link>
              </p>
              <button
                type="button"
                onClick={() => void submeter()}
                disabled={aEntrar}
                className="min-h-[52px] px-8 inline-flex items-center justify-center gap-2 rounded-full bg-primary-400 text-slate-950 font-bold hover:bg-primary-300 active:scale-[0.99] transition shadow-[0_8px_24px_-8px_rgba(255,195,0,0.6)] disabled:opacity-50 disabled:pointer-events-none"
              >
                {aEntrar ? "A entrar…" : "Entrar"} <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}

/* ===== Auxiliares ===== */

const campo =
  "w-full min-h-[48px] px-4 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm outline-none transition focus:border-amber-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-amber-400/30 dark:focus:ring-primary-400/30";

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
