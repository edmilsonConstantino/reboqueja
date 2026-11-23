"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  Building2,
  ChevronDown,
  FileText,
  Home,
  Info,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Moon,
  Phone,
  Sun,
  User,
  X,
} from "lucide-react";
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
      "bg-primary-400 text-slate-950 hover:bg-primary-300 shadow-card",
    contorno:
      "border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0E1629] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-900 dark:text-slate-100",
    fantasma:
      "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]",
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
      className={`bg-white dark:bg-[#0E1629] rounded-2xl shadow-card border border-slate-200/80 dark:border-white/10 ${className}`}
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
    amarelo: "bg-amber-100 text-amber-800 dark:bg-primary-400/15 dark:text-primary-300",
    verde: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
    vermelho: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    cinza: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300",
    azul: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cores[cor]}`}
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
        <span className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
          {rotulo}
        </span>
      )}
      <input
        className={`w-full min-h-[48px] px-4 rounded-xl border bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 text-sm outline-none transition focus:ring-2 focus:ring-primary-400 ${
          erro
            ? "border-red-400"
            : "border-slate-300 dark:border-white/15"
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
        <span className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
          {rotulo}
        </span>
      )}
      <textarea
        className="w-full min-h-[80px] p-3 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-primary-400"
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
        <span className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
          {rotulo}
        </span>
      )}
      <select
        className="w-full min-h-[48px] px-3 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-primary-400"
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
  CLIENTE: { href: "/app", rotulo: "Pedir reboque" },
  CONDUTOR: { href: "/condutor", rotulo: "Painel do condutor" },
  EMPRESA: { href: "/empresa", rotulo: "Painel da empresa" },
  ADMIN: { href: "/admin", rotulo: "Painel admin" },
};

const ROTULO_PAPEL: Record<string, string> = {
  CLIENTE: "Cliente",
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
    { href: "/", rotulo: "Início", icone: <Home className="w-4 h-4" /> },
    { href: "/empresas", rotulo: "Empresas", icone: <Building2 className="w-4 h-4" /> },
    { href: "/termos", rotulo: "Termos", icone: <FileText className="w-4 h-4" /> },
    { href: "/#como-funciona", rotulo: "Sobre", icone: <Info className="w-4 h-4" /> },
  ];
  const estaActivo = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return false;
    return pathname.startsWith(href);
  };

  // Na página inicial a barra fica translúcida sobre o hero até rolar.
  const emCasa = pathname === "/";
  const transparente = emCasa && !rolou && !menuAberto;

  const painel = sessao ? PAINEL_POR_PAPEL[sessao.papel] : null;
  const primeiroNome = sessao?.nome.split(" ")[0] ?? "";
  const inicial = primeiroNome.charAt(0).toUpperCase();

  const accaoAuth =
    pathname === "/entrar"
      ? { href: "/registar", rotulo: "Criar conta" }
      : { href: "/entrar", rotulo: "Entrar" };

  return (
    <header
      className={`${emCasa ? "fixed inset-x-0" : "sticky"} top-0 z-40 pt-[env(safe-area-inset-top)] transition-all duration-300 ${
        transparente
          ? "bg-[#FAF7F2]/70 dark:bg-transparent backdrop-blur-md dark:backdrop-blur-none border-b border-[#E5D6C3]/60 dark:border-transparent"
          : "bg-[#FAF7F2]/95 dark:bg-[#0D0704]/92 backdrop-blur-md border-b border-[#E5D6C3] dark:border-[#3A2212]/80 shadow-sm dark:shadow-lg dark:shadow-black/30"
      }`}
    >
      <div
        className={`max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-6 transition-all duration-300 ${
          transparente ? "h-16 sm:h-20" : "h-16"
        }`}
      >
        {/* Zona 1: Marca */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 shrink-0 whitespace-nowrap"
          aria-label="ReboqueJá — início"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt=""
            className="w-8 h-8 rounded-lg shadow-[0_0_0_2px_rgba(180,83,9,0.28)] dark:shadow-[0_0_0_2px_rgba(245,158,11,0.3)] transition group-hover:scale-105"
          />
          <span className="font-extrabold text-lg tracking-tight text-[#1A100A] dark:text-white">
            Reboque
            <span className="text-[#9A4D0D] dark:text-[#F59E0B]">Já</span>
          </span>
        </Link>

        {/* Zona 2: Links centrais em cápsula */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/85 dark:bg-[#1A0F08]/85 border border-[#DFCEB9] dark:border-[#492C19]/80 shadow-sm dark:shadow-none backdrop-blur-md">
          {itens.map((item) => {
            const activo = estaActivo(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={activo ? "page" : undefined}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition ${
                  activo
                    ? "bg-gradient-to-r from-[#A45312] to-[#7C3B0B] text-white dark:from-[#D97706] dark:to-[#92400E] dark:text-white shadow-sm"
                    : "text-[#594637] hover:text-[#1A100A] hover:bg-[#F5EDE2] dark:text-[#D1C0AE] dark:hover:text-white dark:hover:bg-[#2A180D]"
                }`}
              >
                {item.icone}
                <span>{item.rotulo}</span>
              </Link>
            );
          })}
        </nav>

        {/* Zona 3: Tema + Acção principal */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          <BotaoTema tema={tema} alternar={alternar} />

          {sessao && painel ? (
            <>
              <Link
                href={painel.href}
                className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-full hover:bg-[#EFE4D6] dark:hover:bg-[#1F120A] transition"
                title={`Ir para: ${painel.rotulo}`}
              >
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A45312] to-[#7C3B0B] dark:from-[#F59E0B] dark:to-[#B45309] text-white dark:text-[#140B05] grid place-items-center text-sm font-extrabold">
                  {inicial}
                </span>
                <span className="flex flex-col leading-tight text-left">
                  <span className="text-sm font-semibold text-[#1A100A] dark:text-white max-w-[120px] truncate">
                    {primeiroNome}
                  </span>
                  <span className="text-[11px] text-[#6B5747] dark:text-[#B9A490]">
                    {ROTULO_PAPEL[sessao.papel] ?? sessao.papel}
                  </span>
                </span>
                <ChevronDown className="w-4 h-4 text-[#8C735B] ml-0.5" />
              </Link>
              <button
                onClick={sair}
                disabled={aSair}
                title="Terminar sessão"
                aria-label="Terminar sessão"
                className="w-10 h-10 grid place-items-center rounded-full text-[#6B5747] dark:text-[#B9A490] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              href={accaoAuth.href}
              className="group bg-gradient-to-r from-[#A45312] to-[#7C3B0B] hover:from-[#B45C15] hover:to-[#8B430E] dark:from-[#D97706] dark:to-[#92400E] dark:hover:from-[#F59E0B] dark:hover:to-[#B45309] text-white pl-4 pr-3.5 py-2.5 rounded-full font-bold text-sm inline-flex items-center gap-1.5 transition shadow-md shadow-[#9A4D0D]/25 whitespace-nowrap shrink-0"
            >
              <User className="w-4 h-4" />
              <span>{accaoAuth.rotulo}</span>
              <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>

        {/* Mobile: tema + menu */}
        <div className="flex md:hidden items-center gap-1.5">
          <BotaoTema tema={tema} alternar={alternar} />
          <button
            onClick={() => setMenuAberto((v) => !v)}
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuAberto}
            className="w-10 h-10 grid place-items-center rounded-full text-[#2C1C12] dark:text-[#F5EDE4] hover:bg-[#EFE4D6] dark:hover:bg-[#1F120A] transition"
          >
            {menuAberto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuAberto && (
        <div className="md:hidden border-t border-[#E5D6C3] dark:border-[#3A2212] bg-[#FAF7F2] dark:bg-[#120A05] px-4 pb-4 pt-2 shadow-lg">
          {sessao && painel && (
            <div className="flex items-center gap-3 py-3 mb-2 border-b border-[#E5D6C3] dark:border-[#3A2212]">
              <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A45312] to-[#7C3B0B] dark:from-[#F59E0B] dark:to-[#B45309] text-white dark:text-[#140B05] grid place-items-center font-extrabold">
                {inicial}
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-[#1A100A] dark:text-white">{sessao.nome}</p>
                <p className="text-xs text-[#6B5747] dark:text-[#B9A490]">{ROTULO_PAPEL[sessao.papel] ?? sessao.papel}</p>
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
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                    activo
                      ? "bg-[#EFE4D6] text-[#9A4D0D] dark:bg-[#2A180D] dark:text-[#FBBF24]"
                      : "text-[#4A3728] hover:bg-[#EFE4D6]/60 hover:text-[#1A100A] dark:text-[#D1C0AE] dark:hover:bg-[#1E1109] dark:hover:text-white"
                  }`}
                >
                  {item.icone}
                  <span>{item.rotulo}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            {sessao && painel ? (
              <>
                <Link
                  href={painel.href}
                  className="w-full text-center bg-gradient-to-r from-[#A45312] to-[#7C3B0B] dark:from-[#F59E0B] dark:to-[#B45309] text-white dark:text-[#140B05] py-3 rounded-xl font-bold text-sm"
                >
                  {painel.rotulo}
                </Link>
                <button
                  onClick={sair}
                  disabled={aSair}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/40 text-red-600 dark:text-red-400 text-sm font-bold disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{aSair ? "A sair…" : "Sair"}</span>
                </button>
              </>
            ) : (
              <Link
                href={accaoAuth.href}
                className="w-full text-center bg-gradient-to-r from-[#A45312] to-[#7C3B0B] dark:from-[#D97706] dark:to-[#92400E] text-white py-3 rounded-xl font-bold text-sm"
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
      title={tema === "escuro" ? "Mudar para modo claro" : "Mudar para modo escuro"}
      className="w-10 h-10 grid place-items-center rounded-full border border-[#DFCEB9] bg-white/80 text-[#594637] hover:text-[#9A4D0D] hover:bg-white dark:border-[#492C19]/80 dark:bg-[#1A0F08]/80 dark:text-[#D1C0AE] dark:hover:text-[#F59E0B] dark:hover:bg-[#2A180D] transition"
    >
      {tema === "escuro" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

export function Rodape() {
  const [emailNewsletter, setEmailNewsletter] = useState("");
  const [subscrito, setSubscrito] = useState(false);
  const [erroNewsletter, setErroNewsletter] = useState("");

  const subscrever = (e: FormEvent) => {
    e.preventDefault();
    const v = emailNewsletter.trim();
    if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setErroNewsletter("Indique um email válido.");
      setSubscrito(false);
      return;
    }
    setErroNewsletter("");
    setSubscrito(true);
    setEmailNewsletter("");
  };

  const voltarTopo = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-[#E5D6C3] dark:border-[#3A2212]/80 bg-[#F3ECE2] dark:bg-[#090402] text-[#2C1C12] dark:text-[#E7D8C7] transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Coluna 1: Marca e canais */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt=""
                className="w-9 h-9 rounded-lg shadow-[0_0_0_2px_rgba(180,83,9,0.25)] dark:shadow-[0_0_0_2px_rgba(245,158,11,0.3)] transition group-hover:scale-105"
              />
              <span className="font-extrabold text-lg tracking-tight text-[#1A100A] dark:text-white">
                Reboque<span className="text-[#9A4D0D] dark:text-[#F59E0B]">Já</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-[#6B5747] dark:text-[#B9A490] mt-3 max-w-xs leading-relaxed">
              Conectando condutores e empresas de reboque na Cidade da Matola.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <Link
                href="/empresas"
                aria-label="Empresas parceiras"
                className="w-8 h-8 rounded-full bg-white/80 dark:bg-[#1A0F08] border border-[#DFCEB9] dark:border-[#492C19]/80 grid place-items-center text-[#594637] dark:text-[#D1C0AE] hover:text-[#9A4D0D] dark:hover:text-[#F59E0B] transition"
              >
                <Building2 className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/entrar"
                aria-label="Contactar ou entrar"
                className="w-8 h-8 rounded-full bg-white/80 dark:bg-[#1A0F08] border border-[#DFCEB9] dark:border-[#492C19]/80 grid place-items-center text-[#594637] dark:text-[#D1C0AE] hover:text-[#9A4D0D] dark:hover:text-[#F59E0B] transition"
              >
                <Phone className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/termos"
                aria-label="Email e termos"
                className="w-8 h-8 rounded-full bg-white/80 dark:bg-[#1A0F08] border border-[#DFCEB9] dark:border-[#492C19]/80 grid place-items-center text-[#594637] dark:text-[#D1C0AE] hover:text-[#9A4D0D] dark:hover:text-[#F59E0B] transition"
              >
                <Mail className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/app/pedido/novo"
                aria-label="Mapa de cobertura"
                className="w-8 h-8 rounded-full bg-white/80 dark:bg-[#1A0F08] border border-[#DFCEB9] dark:border-[#492C19]/80 grid place-items-center text-[#594637] dark:text-[#D1C0AE] hover:text-[#9A4D0D] dark:hover:text-[#F59E0B] transition"
              >
                <MapPin className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Coluna 2: Links Rápidos */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1A100A] dark:text-white mb-3">
              Links Rápidos
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-[#6B5747] dark:text-[#B9A490]">
              <li>
                <Link href="/" className="hover:text-[#9A4D0D] dark:hover:text-[#F59E0B] transition">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/empresas" className="hover:text-[#9A4D0D] dark:hover:text-[#F59E0B] transition">
                  Empresas
                </Link>
              </li>
              <li>
                <Link href="/termos" className="hover:text-[#9A4D0D] dark:hover:text-[#F59E0B] transition">
                  Termos
                </Link>
              </li>
              <li>
                <Link href="/#como-funciona" className="hover:text-[#9A4D0D] dark:hover:text-[#F59E0B] transition">
                  Sobre
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Suporte */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1A100A] dark:text-white mb-3">
              Suporte
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-[#6B5747] dark:text-[#B9A490]">
              <li>
                <Link href="/registar" className="hover:text-[#9A4D0D] dark:hover:text-[#F59E0B] transition">
                  Pedir reboque
                </Link>
              </li>
              <li>
                <Link href="/registar/empresa" className="hover:text-[#9A4D0D] dark:hover:text-[#F59E0B] transition">
                  Sou empresa
                </Link>
              </li>
              <li>
                <Link href="/entrar" className="hover:text-[#9A4D0D] dark:hover:text-[#F59E0B] transition">
                  Entrar
                </Link>
              </li>
              <li>
                <Link href="/termos" className="hover:text-[#9A4D0D] dark:hover:text-[#F59E0B] transition">
                  Privacidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Newsletter */}
          <div className="lg:col-span-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#1A100A] dark:text-white mb-2">
              Receba novidades
            </h3>
            <p className="text-xs text-[#6B5747] dark:text-[#B9A490] mb-3">
              Subscreva para ficar por dentro das novidades.
            </p>
            <form onSubmit={subscrever} className="flex items-center gap-2">
              <input
                type="email"
                value={emailNewsletter}
                onChange={(e) => setEmailNewsletter(e.target.value)}
                placeholder="Seu e-mail"
                aria-label="Seu e-mail"
                className="flex-1 min-w-0 h-10 px-3.5 rounded-full border border-[#DFCEB9] dark:border-[#492C19]/80 bg-white dark:bg-[#1A0F08] text-xs text-[#1A100A] dark:text-white placeholder:text-[#9A8470] dark:placeholder:text-[#7E6651] outline-none focus:ring-2 focus:ring-[#D97706]/40"
              />
              <button
                type="submit"
                className="h-10 px-4 rounded-full bg-gradient-to-r from-[#A45312] to-[#7C3B0B] hover:from-[#B45C15] hover:to-[#8B430E] dark:from-[#F59E0B] dark:to-[#D97706] dark:hover:from-[#FBBF24] dark:hover:to-[#F59E0B] text-white dark:text-[#140B05] font-bold text-xs whitespace-nowrap shrink-0 transition"
              >
                Subscrever
              </button>
            </form>
            {erroNewsletter && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">
                {erroNewsletter}
              </p>
            )}
            {subscrito && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1.5 font-medium">
                Subscrição registada com sucesso.
              </p>
            )}
          </div>
        </div>

        {/* Barra inferior de direitos */}
        <div className="mt-10 pt-6 border-t border-[#E5D6C3] dark:border-[#3A2212]/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B5747] dark:text-[#9A8470]">
          <p className="text-center sm:text-left">
            © 2026 ReboqueJá. Todos os direitos reservados.{" "}
            <span aria-hidden className="mx-1.5">|</span> Cidade da Matola ·
            Protótipo académico · Preços em MT
          </p>
          <button
            type="button"
            onClick={voltarTopo}
            aria-label="Voltar ao topo"
            title="Voltar ao topo"
            className="w-9 h-9 rounded-full bg-white dark:bg-[#1A0F08] border border-[#DFCEB9] dark:border-[#492C19]/80 grid place-items-center text-[#594637] dark:text-[#D1C0AE] hover:text-[#9A4D0D] dark:hover:text-[#F59E0B] transition shrink-0"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
