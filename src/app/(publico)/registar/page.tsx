"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AvisoErro } from "@/components/ui";

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
              titulo="Criar conta de condutor"
              descricao="Está no passo certo"
              activo
            />
            <ItemLateral
              icone={<IconePin className="w-5 h-5" />}
              titulo="1. Peça o reboque"
              descricao="Marque o local no mapa"
            />
            <ItemLateral
              icone={<IconeEtiqueta className="w-5 h-5" />}
              titulo="2. Compare ofertas"
              descricao="Faixas de preço e avaliações"
            />
            <ItemLateral
              icone={<IconeCamiao className="w-5 h-5" />}
              titulo="3. Acompanhe"
              descricao="O camião em tempo real"
            />
          </nav>

          {/* Cartão de dica */}
          <div className="mt-auto rounded-2xl bg-white/[0.06] border border-white/10 p-4">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-primary-400 uppercase mb-2">
              <IconeEstrela className="w-4 h-4" /> Dica
            </p>
            <p className="text-xs text-neutral-400 leading-relaxed">
              A conta é gratuita. Só paga o serviço quando o reboque concluir o
              transporte — em dinheiro, M-Pesa ou e-Mola.
            </p>
          </div>
        </aside>

        {/* ===== Painel principal direito ===== */}
        <section className="p-6 sm:p-10 lg:p-12">
          <header className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight">Criar conta de condutor</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5">
              Peça reboque em minutos ·{" "}
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
                <h2 className="font-bold text-lg">Os seus dados</h2>
              </div>

              <form onSubmit={submeter} className="space-y-4" id="form-registo">
                <label className="block">
                  <span className="block text-sm font-medium mb-1.5">
                    Nome completo <b className="text-red-500">*</b>
                  </span>
                  <input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex.: João Macuácua"
                    autoComplete="name"
                    required
                    className={campo}
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-1.5">
                    Telefone <b className="text-red-500">*</b>
                  </span>
                  <input
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    placeholder="+258 84 123 4567"
                    autoComplete="tel"
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
                    value={form.senha}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    placeholder="Mínimo 4 caracteres"
                    autoComplete="new-password"
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
                Já tem conta?{" "}
                <Link href="/entrar" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                  Entrar
                </Link>
              </p>
              <button
                type="submit"
                form="form-registo"
                disabled={aEnviar}
                className="min-h-[52px] px-8 inline-flex items-center justify-center gap-2 rounded-full bg-primary-400 text-neutral-950 font-bold hover:bg-primary-300 active:scale-[0.99] transition shadow-[0_8px_24px_-8px_rgba(255,195,0,0.6)] disabled:opacity-50 disabled:pointer-events-none"
              >
                {aEnviar ? "A criar conta…" : "Criar conta"} <span aria-hidden>→</span>
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
  activo = false,
}: {
  icone: React.ReactNode;
  titulo: string;
  descricao: string;
  activo?: boolean;
}) {
  return (
    <span
      className={`flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition border ${
        activo
          ? "bg-primary-400 text-neutral-950 border-primary-300 shadow-[0_8px_24px_-10px_rgba(255,195,0,0.7)]"
          : "bg-white/[0.04] border-white/10 text-neutral-200"
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
function IconePin(p: P) {
  return (<svg {...svg} {...p}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>);
}
function IconeEtiqueta(p: P) {
  return (<svg {...svg} {...p}><path d="M3 12V4h8l10 10-8 8L3 12Z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>);
}
function IconeEstrela(p: P) {
  return (<svg {...svg} fill="currentColor" stroke="none" {...p}><path d="m12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.9 6.4 20l1.3-6.2L3 9.5l6.3-.7L12 3Z" /></svg>);
}
function IconeUtilizador(p: P) {
  return (<svg {...svg} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>);
}
