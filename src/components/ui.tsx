"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usarTema } from "@/components/ProvedorTema";

export function Botao({
  children,
  variante = "primario",
  className = "",
  ...props
}: {
  children: ReactNode;
  variante?: "primario" | "contorno" | "fantasma" | "perigo" | "sucesso";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    "min-h-[48px] px-5 rounded-xl font-semibold text-sm transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none inline-flex items-center justify-center gap-2";
  const variantes: Record<string, string> = {
    primario:
      "bg-primary-400 text-neutral-900 hover:bg-primary-300 shadow-card",
    contorno:
      "border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100",
    fantasma:
      "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
    perigo: "bg-red-600 text-white hover:bg-red-500",
    sucesso: "bg-emerald-600 text-white hover:bg-emerald-500",
  };
  return (
    <button className={`${base} ${variantes[variante]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Cartao({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-neutral-900 rounded-2xl shadow-card border border-neutral-100 dark:border-neutral-800 ${className}`}
    >
      {children}
    </div>
  );
}

export function Etiqueta({
  children,
  cor = "amarelo",
}: {
  children: ReactNode;
  cor?: "amarelo" | "verde" | "vermelho" | "cinza" | "azul";
}) {
  const cores: Record<string, string> = {
    amarelo: "bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200",
    verde: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    vermelho: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    cinza: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
    azul: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cores[cor]}`}
    >
      {children}
    </span>
  );
}

export function Entrada({
  rotulo,
  erro,
  ...props
}: { rotulo?: string; erro?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      {rotulo && (
        <span className="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">
          {rotulo}
        </span>
      )}
      <input
        className={`w-full min-h-[48px] px-4 rounded-xl border bg-white dark:bg-neutral-900 text-sm outline-none transition focus:ring-2 focus:ring-primary-400 ${
          erro
            ? "border-red-400"
            : "border-neutral-300 dark:border-neutral-700"
        }`}
        {...props}
      />
      {erro && <span className="block text-xs text-red-500 mt-1">{erro}</span>}
    </label>
 );
}

export function AreaTexto({
  rotulo,
  ...props
}: { rotulo?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      {rotulo && (
        <span className="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">
          {rotulo}
        </span>
      )}
      <textarea
        className="w-full min-h-[80px] p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm outline-none focus:ring-2 focus:ring-primary-400"
        {...props}
      />
    </label>
  );
}

export function Selector({
  rotulo,
  children,
  ...props
}: { rotulo?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      {rotulo && (
        <span className="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">
          {rotulo}
        </span>
      )}
      <select
        className="w-full min-h-[48px] px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm outline-none focus:ring-2 focus:ring-primary-400"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Estrelas({
  valor,
  aoMudar,
  tamanho = "grande",
}: {
  valor: number;
  aoMudar?: (v: number) => void;
  tamanho?: "grande" | "pequeno";
}) {
  const size = tamanho === "grande" ? "text-4xl" : "text-base";
  return (
    <div className={`flex gap-1 ${tamanho === "grande" ? "justify-center" : ""}`}>
      {[1, 2, 3, 4, 5].map((n) =>
        aoMudar ? (
          <button
            key={n}
            type="button"
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
            className={`${size} leading-none transition hover:scale-110 ${
              n <= valor ? "text-primary-400" : "text-neutral-300 dark:text-neutral-700"
            }`}
            onClick={() => aoMudar(n)}
          >
            ★
          </button>
        ) : (
          <span
            key={n}
            className={`${size === "text-4xl" ? "text-base" : size} leading-none ${
              n <= Math.round(valor)
                ? "text-primary-400"
                : "text-neutral-300 dark:text-neutral-700"
            }`}
          >
            ★
          </span>
        )
      )}
    </div>
  );
}

export function Vazio({
  titulo,
  descricao,
  accao,
}: {
  titulo: string;
  descricao?: string;
  accao?: ReactNode;
}) {
  return (
    <div className="text-center py-14 px-6">
      <div className="text-5xl mb-3">🛻</div>
      <h3 className="font-bold text-lg">{titulo}</h3>
      {descricao && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
          {descricao}
        </p>
      )}
      {accao && <div className="mt-5 flex justify-center">{accao}</div>}
    </div>
  );
}

export function Carregando({ texto = "A carregar…" }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-primary-400 border-t-transparent animate-spin" />
      <p className="text-sm text-neutral-500">{texto}</p>
    </div>
  );
}

export function AvisoErro({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return (
    <div
      className={`bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3 border border-red-200 dark:border-red-900 ${className}`}
    >
      {children}
    </div>
  );
}

export function BarraNavegacaoPublica() {
  const { tema, alternar } = usarTema();
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-neutral-950/90 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-lg">
          <span className="w-8 h-8 rounded-lg bg-primary-400 grid place-items-center">
            🛻
          </span>
          Reboque<span className="text-primary-500">Já</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3 text-sm font-medium">
          <Link href="/empresas" className="px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
            Empresas
          </Link>
          <Link href="/termos" className="px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
            Termos
          </Link>
          <button
            onClick={alternar}
            aria-label="Alternar tema"
            className="w-10 h-10 grid place-items-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {tema === "escuro" ? "☀️" : "🌙"}
          </button>
          <Link
            href="/entrar"
            className="ml-1 bg-primary-400 text-neutral-900 px-4 py-2 rounded-xl font-semibold hover:bg-primary-300"
          >
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Rodape() {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 py-8 mt-16">
      <div className="max-w-5xl mx-auto px-4 text-center text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
        <p className="font-semibold text-neutral-700 dark:text-neutral-300">
          ReboqueJá — protótipo académico
        </p>
        <p>Cidade da Matola, Moçambique · Preços em Meticais (MT)</p>
        <p>
          Trabalho de fim de curso · Sem pagamento real · Dados fictícios no
          protótipo
        </p>
      </div>
    </footer>
  );
}
