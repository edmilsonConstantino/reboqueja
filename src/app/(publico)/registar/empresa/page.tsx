"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AvisoErro } from "@/components/ui";
import { BAIRROS_MATOLA } from "@/lib/constants";

const BENEFICIOS = [
  { titulo: "Aumente a sua visibilidade", icone: <IconeMaos className="w-5 h-5" /> },
  { titulo: "Conquiste mais clientes", icone: <IconePessoas className="w-5 h-5" /> },
  { titulo: "Faça crescer o seu negócio", icone: <IconeFoguete className="w-5 h-5" /> },
];

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
    <div className="relative overflow-hidden bg-[#f6f7fb] dark:bg-neutral-950 py-6 sm:py-12">
      {/* Fundos decorativos */}
      <div aria-hidden className="pointer-events-none absolute -top-28 -left-24 w-72 h-72 rounded-full bg-primary-300/45 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-36 -right-24 w-96 h-96 rounded-full bg-primary-200/50 blur-3xl dark:bg-primary-900/20" />

      <div className="relative max-w-5xl mx-auto px-3 sm:px-6">
        <div className="grid lg:grid-cols-[minmax(0,360px)_1fr] rounded-3xl overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-white/10 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)]">

          {/* ===== Painel esquerdo ===== */}
          <aside className="relative flex flex-col gap-5 p-5 sm:p-8 bg-gradient-to-b from-primary-50 to-primary-200/80 dark:from-neutral-800 dark:to-neutral-900">
            <Link href="/" className="hidden sm:flex items-center gap-2.5" aria-label="ReboqueJá — início">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt=""
                className="w-10 h-10 rounded-xl shadow-[0_0_0_3px_rgba(255,195,0,0.2)]"
              />
              <span className="font-extrabold text-lg tracking-tight text-neutral-900 dark:text-white">
                Reboque<span className="text-primary-600 dark:text-primary-400">Já</span>
              </span>
            </Link>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight text-neutral-900 dark:text-white">
                Registe a sua{" "}
                <span className="text-primary-600 dark:text-primary-400">empresa de reboque</span>
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2 leading-relaxed">
                Faça parte da nossa plataforma e ofereça os seus serviços a mais
                condutores na Matola.
              </p>
            </div>

            <ul className="hidden sm:block space-y-3">
              {BENEFICIOS.map((b) => (
                <li key={b.titulo} className="flex items-center gap-3">
                  <span className="w-9 h-9 shrink-0 rounded-xl bg-primary-400 text-neutral-900 grid place-items-center shadow-card">
                    {b.icone}
                  </span>
                  <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    {b.titulo}
                  </span>
                </li>
              ))}
            </ul>

            {/* Foto do camião: faixa no telemóvel, no fundo no desktop */}
            <div className="relative -mx-5 -mb-5 sm:-mx-8 sm:-mb-8 sm:mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/login.jpg"
                alt="Camião de reboque amarelo a transportar um carro"
                className="w-full h-32 sm:h-44 lg:h-52 object-cover"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-primary-400/25 to-transparent" />
            </div>
          </aside>

          {/* ===== Formulário ===== */}
          <section className="p-5 sm:p-8 lg:p-10">
            <header className="flex items-start gap-3 mb-6">
              <span className="w-11 h-11 shrink-0 rounded-2xl bg-primary-400 text-neutral-900 grid place-items-center">
                <IconePredio className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Registar empresa de reboque
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Preencha os dados abaixo para cadastrar a sua empresa na plataforma.
                </p>
              </div>
            </header>

            <form onSubmit={submeter} className="space-y-4">
              <Campo
                rotulo="Nome da empresa"
                icone={<IconePredio className="w-[18px] h-[18px]" />}
                placeholder="Ex.: Reboque Machado Lda"
                autoComplete="organization"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Campo
                  rotulo="NUIT"
                  icone={<IconeDoc className="w-[18px] h-[18px]" />}
                  placeholder="Digite o NUIT"
                  inputMode="numeric"
                  value={form.nuit}
                  onChange={(e) => setForm({ ...form, nuit: e.target.value })}
                  required
                />
                <Campo
                  rotulo="Telefone"
                  icone={<IconeTelefone className="w-[18px] h-[18px]" />}
                  placeholder="+258 84 000 0000"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  required
                />
              </div>

              <Campo
                rotulo="Email"
                icone={<IconeEmail className="w-[18px] h-[18px]" />}
                type="email"
                placeholder="exemplo@empresa.com"
                autoComplete="email"
                autoCapitalize="none"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />

              <Campo
                rotulo="Endereço (sede)"
                icone={<IconePin className="w-[18px] h-[18px]" />}
                placeholder="Av. dos Pios, n.º 120"
                autoComplete="street-address"
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                required
              />

              <label className="block">
                <span className="block text-sm font-semibold mb-1.5 text-neutral-700 dark:text-neutral-200">
                  Bairro de operação <b className="text-primary-600">*</b>
                </span>
                <span className="relative block">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
                  >
                    <IconePin className="w-[18px] h-[18px]" />
                  </span>
                  <select
                    className="w-full min-h-[48px] pl-11 pr-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm outline-none transition appearance-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30"
                    value={form.bairro}
                    onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                  >
                    {BAIRROS_MATOLA.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                  >
                    <IconeSeta className="w-4 h-4" />
                  </span>
                </span>
              </label>

              <Campo
                rotulo="Palavra-passe"
                icone={<IconeCadeado className="w-[18px] h-[18px]" />}
                type="password"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
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
                  className="mt-1 w-5 h-5 accent-primary-500 shrink-0"
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

              <button
                type="submit"
                disabled={aEnviar}
                className="w-full min-h-[54px] inline-flex items-center justify-center gap-2 rounded-full bg-primary-400 text-neutral-950 font-extrabold text-sm sm:text-base hover:bg-primary-300 active:scale-[0.99] transition shadow-[0_12px_28px_-12px_rgba(255,195,0,0.9)] disabled:opacity-60 disabled:pointer-events-none"
              >
                <IconeCheck className="w-5 h-5" />
                {aEnviar ? "A registar…" : "Registar Empresa"}
              </button>

              <p className="flex items-center justify-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 pt-1">
                <IconeEscudo className="w-4 h-4 shrink-0" />
                Os seus dados estão seguros connosco.
              </p>

              <p className="text-sm text-center text-neutral-600 dark:text-neutral-400">
                Já tem conta?{" "}
                <Link href="/entrar" className="text-primary-700 dark:text-primary-400 font-semibold">
                  Entrar
                </Link>
              </p>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ===== Campo com ícone ===== */

function Campo({
  rotulo,
  icone,
  className = "",
  ...props
}: { rotulo: string; icone: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-1.5 text-neutral-700 dark:text-neutral-200">
        {rotulo} <b className="text-primary-600">*</b>
      </span>
      <span className="relative block">
        <span
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
        >
          {icone}
        </span>
        <input
          className={`w-full min-h-[48px] pl-11 pr-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 ${className}`}
          {...props}
        />
      </span>
    </label>
  );
}

/* ===== Ícones ===== */

type P = React.SVGProps<SVGSVGElement>;
const svg = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconePredio(p: P) {
  return (
    <svg {...svg} {...p}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M9 7h1.5M13.5 7H15M9 11h1.5M13.5 11H15M9 15h1.5M13.5 15H15" />
      <path d="M10.5 21v-3h3v3" />
    </svg>
  );
}
function IconeDoc(p: P) {
  return (
    <svg {...svg} {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 10h4M7 14h7" />
    </svg>
  );
}
function IconeTelefone(p: P) {
  return (
    <svg {...svg} {...p}>
      <path d="M5 3h3l2 5-2.5 1.5a12 12 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2.2 2A17 17 0 0 1 3 5.2 2 2 0 0 1 5 3Z" />
    </svg>
  );
}
function IconeEmail(p: P) {
  return (
    <svg {...svg} {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6 8.5-6" />
    </svg>
  );
}
function IconePin(p: P) {
  return (
    <svg {...svg} {...p}>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}
function IconeCadeado(p: P) {
  return (
    <svg {...svg} {...p}>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
function IconeSeta(p: P) {
  return (
    <svg {...svg} {...p}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function IconeCheck(p: P) {
  return (
    <svg {...svg} strokeWidth={2.6} {...p}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}
function IconeEscudo(p: P) {
  return (
    <svg {...svg} {...p}>
      <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function IconeMaos(p: P) {
  return (
    <svg {...svg} {...p}>
      <path d="M7 11 4 8l3-3 3 3" />
      <path d="m17 13 3 3-3 3-3-3" />
      <path d="M10 8l4 4M14 8l-4 4" />
      <path d="M8 15l3 3M16 9l-3-3" />
    </svg>
  );
}
function IconePessoas(p: P) {
  return (
    <svg {...svg} {...p}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c1.2-3.2 3.6-5 6.5-5s5.3 1.8 6.5 5" />
      <path d="M16 5a3.5 3.5 0 0 1 0 7" />
      <path d="M18.5 15.5c1.6.8 2.7 2.3 3.3 4.5" />
    </svg>
  );
}
function IconeFoguete(p: P) {
  return (
    <svg {...svg} {...p}>
      <path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1Z" />
      <path d="M12 15 9 12a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2Z" />
      <path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0" />
      <path d="M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5" />
    </svg>
  );
}
