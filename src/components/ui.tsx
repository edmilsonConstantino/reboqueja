"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
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

const PAINEL_POR_PAPEL: Record<string, { href: string; rotulo: string }> = {
  CONDUTOR: { href: "/app", rotulo: "Pedir reboque" },
  EMPRESA: { href: "/empresa", rotulo: "Painel da empresa" },
  ADMIN: { href: "/admin", rotulo: "Painel admin" },
};

const ROTULO_PAPEL: Record<string, string> = {
  CONDUTOR: "Condutor",
  EMPRESA: "Empresa",
  ADMIN: "Administrador",
};

export function BarraNavegacaoPublica() {
  const { tema, alternar } = usarTema();
  const pathname = usePathname();
  const router = useRouter();
  const [sessao, setSessao] = useState<{ nome: string; papel: string } | null>(null);
  const [aSair, setASair] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [rolou, setRolou] = useState(false);

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 12);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  // Páginas de autenticação: não mostrar a sessão de outra conta.
  const paginaAuth = pathname === "/entrar" || pathname.startsWith("/registar");

  useEffect(() => {
    setMenuAberto(false);
    if (paginaAuth) {
      setSessao(null);
      return;
    }
    let vivo = true;
    fetch("/api/sessao", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!vivo) return;
        setSessao(d?.logado ? { nome: String(d.nome), papel: String(d.papel) } : null);
      })
      .catch(() => vivo && setSessao(null));
    return () => {
      vivo = false;
    };
  }, [pathname, paginaAuth]);

  const sair = async () => {
    setASair(true);
    try {
      await fetch("/api/sair", { method: "POST" });
      setSessao(null);
      router.push("/");
      router.refresh();
    } finally {
      setASair(false);
    }
  };

  const itens = [
    { href: "/", rotulo: "Início", icone: <IconeCasa className="w-[18px] h-[18px]" /> },
    { href: "/empresas", rotulo: "Empresas", icone: <IconePredio className="w-[18px] h-[18px]" /> },
    { href: "/termos", rotulo: "Termos", icone: <IconeDoc className="w-[18px] h-[18px]" /> },
  ];
  const estaActivo = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Na página inicial a barra fica transparente sobre o hero até rolar.
  const emCasa = pathname === "/";
  const transparente = emCasa && !rolou && !menuAberto;

  const painel = sessao ? PAINEL_POR_PAPEL[sessao.papel] : null;
  const primeiroNome = sessao?.nome.split(" ")[0] ?? "";
  const inicial = primeiroNome.charAt(0).toUpperCase();

  // Botão de acção quando não há sessão (adapta-se à página actual)
  const accaoAuth =
    pathname === "/entrar"
      ? { href: "/registar", rotulo: "Criar conta" }
      : { href: "/entrar", rotulo: "Entrar" };

  return (
    <header className="sticky top-0 z-40 bg-[#060911]/90 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2 shrink-0" aria-label="ReboqueJá — início">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt=""
            className="w-8 h-8 rounded-lg shadow-[0_0_0_2px_rgba(255,195,0,0.15)] transition group-hover:scale-105"
          />
          <span className="font-extrabold text-lg tracking-tight text-white">
            Reboque<span className="text-primary-400">Já</span>
          </span>
        </Link>

        {/* Links centrais (desktop) */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/10">
          {itens.map((item) => {
            const activo = estaActivo(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={activo ? "page" : undefined}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition ${
                  activo
                    ? "bg-primary-400 text-neutral-950 shadow-[0_4px_14px_-4px_rgba(255,195,0,0.6)]"
                    : "text-neutral-300 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {item.icone}
                {item.rotulo}
              </Link>
            );
          })}
        </nav>

        {/* Acções (desktop) */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <BotaoTema tema={tema} alternar={alternar} />

          {sessao && painel ? (
            <>
              <Link
                href={painel.href}
                className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-white/[0.06] transition"
                title={`Ir para: ${painel.rotulo}`}
              >
                <span className="w-8 h-8 rounded-full bg-primary-400 text-neutral-950 grid place-items-center text-sm font-extrabold">
                  {inicial}
                </span>
                <span className="flex flex-col leading-tight text-left">
                  <span className="text-sm font-semibold text-white max-w-[120px] truncate">
                    {primeiroNome}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {ROTULO_PAPEL[sessao.papel] ?? sessao.papel}
                  </span>
                </span>
                <IconeChevronBaixo className="w-4 h-4 text-neutral-400 ml-0.5" />
              </Link>
              <button
                onClick={sair}
                disabled={aSair}
                title="Terminar sessão"
                aria-label="Terminar sessão"
                className="w-10 h-10 grid place-items-center rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
              >
                <IconeSair className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              {!paginaAuth && (
                <Link
                  href="/registar/empresa"
                  className="hidden lg:inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold text-neutral-300 hover:text-white transition"
                >
                  Sou empresa
                </Link>
              )}
              <Link
                href={accaoAuth.href}
                className="group bg-primary-400 text-neutral-950 pl-4 pr-3 py-2.5 rounded-full font-bold text-sm hover:bg-primary-300 inline-flex items-center gap-1.5 transition shadow-[0_4px_14px_-4px_rgba(255,195,0,0.6)]"
              >
                <IconeUtilizador className="w-4 h-4" /> {accaoAuth.rotulo}
                <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile: tema + menu */}
        <div className="flex md:hidden items-center gap-1">
          <BotaoTema tema={tema} alternar={alternar} />
          <button
            onClick={() => setMenuAberto((v) => !v)}
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuAberto}
            className="w-10 h-10 grid place-items-center rounded-lg text-neutral-200 hover:bg-neutral-900 transition"
          >
            {menuAberto ? <IconeFechar className="w-6 h-6" /> : <IconeMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuAberto && (
        <div className="md:hidden border-t border-white/10 bg-neutral-950 px-4 pb-4 pt-2">
          {sessao && painel && (
            <div className="flex items-center gap-3 py-3 mb-2 border-b border-neutral-800">
              <span className="w-10 h-10 rounded-full bg-primary-400 text-neutral-950 grid place-items-center font-extrabold">
                {inicial}
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-white">{sessao.nome}</p>
                <p className="text-xs text-neutral-400">{ROTULO_PAPEL[sessao.papel] ?? sessao.papel}</p>
              </div>
            </div>
          )}
          <nav className="flex flex-col gap-1">
            {itens.map((item) => {
              const activo = estaActivo(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition ${
                    activo
                      ? "bg-neutral-900 text-primary-400"
                      : "text-neutral-300 hover:bg-neutral-900 hover:text-white"
                  }`}
                >
                  {item.icone}
                  {item.rotulo}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            {sessao && painel ? (
              <>
                <Link
                  href={painel.href}
                  className="w-full text-center bg-primary-400 text-neutral-950 py-3 rounded-xl font-bold text-sm"
                >
                  {painel.rotulo}
                </Link>
                <button
                  onClick={sair}
                  disabled={aSair}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/60 text-red-400 text-sm font-bold disabled:opacity-50"
                >
                  <IconeSair className="w-4 h-4" />
                  {aSair ? "A sair…" : "Sair"}
                </button>
              </>
            ) : (
              <Link
                href={accaoAuth.href}
                className="w-full text-center bg-primary-400 text-neutral-950 py-3 rounded-xl font-bold text-sm"
              >
                {accaoAuth.rotulo}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function BotaoTema({ tema, alternar }: { tema: string; alternar: () => void }) {
  return (
    <button
      onClick={alternar}
      aria-label="Alternar tema"
      title={tema === "escuro" ? "Modo claro" : "Modo escuro"}
      className="w-10 h-10 grid place-items-center rounded-full text-neutral-300 hover:text-primary-400 hover:bg-white/[0.06] transition"
    >
      {tema === "escuro" ? <IconeSol className="w-5 h-5" /> : <IconeLua className="w-5 h-5" />}
    </button>
  );
}

/* ===== Ícones da navbar ===== */

function IconeMenu(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function IconeFechar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function IconeSol(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function IconeLua(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

function IconeCasa(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

function IconePredio(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M9 7h1.5M13.5 7H15M9 11h1.5M13.5 11H15M9 15h1.5M13.5 15H15" />
      <path d="M10.5 21v-3h3v3" />
    </svg>
  );
}

function IconeDoc(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}

function IconeUtilizador(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

function IconeSair(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function IconeChevronBaixo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function Rodape() {
  return (
    <footer className="border-t border-white/10 py-10 mt-16 bg-[#060911] text-center">
      <div className="max-w-5xl mx-auto px-4 flex flex-col items-center gap-2">
        <Link href="/" className="inline-flex items-center gap-2 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt=""
            className="w-7 h-7 rounded-lg shadow-[0_0_0_2px_rgba(255,195,0,0.2)] transition group-hover:scale-105"
          />
          <span className="font-extrabold text-base tracking-tight text-white">
            Reboque<span className="text-primary-400">Já</span>
          </span>
        </Link>
        <p className="text-xs font-semibold text-neutral-300 mt-1">
          Reboque Já — protótipo académico
        </p>
        <p className="text-xs text-neutral-400">
          Cidade da Matola, Moçambique • Preços em Meticais (MT)
        </p>
        <p className="text-xs text-neutral-500">
          Trabalho de fim de curso • Sem pagamento real • Dados fictícios no protótipo
        </p>
      </div>
    </footer>
  );
}
