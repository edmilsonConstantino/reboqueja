"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ITENS = [
  { href: "/admin", rotulo: "Dashboard", exact: true, icone: IconeCasa },
  { href: "/admin/empresas", rotulo: "Empresas", exact: false, icone: IconePredio },
  { href: "/admin/pedidos", rotulo: "Pedidos", exact: false, icone: IconeCaixa },
  { href: "/admin/utilizadores", rotulo: "Utilizadores", exact: false, icone: IconePessoas },
  { href: "/admin/avaliacoes", rotulo: "Avaliações", exact: false, icone: IconeEstrela },
];

function useSair() {
  const router = useRouter();
  const [aSair, setASair] = useState(false);
  const sair = async () => {
    setASair(true);
    try {
      await fetch("/api/sair", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setASair(false);
    }
  };
  return { sair, aSair };
}

function Logo({ compacto = false }: { compacto?: boolean }) {
  return (
    <Link href="/admin" className="group flex items-center gap-2.5 shrink-0" aria-label="ReboqueJá — dashboard">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.svg"
        alt=""
        className="w-9 h-9 rounded-xl shadow-[0_0_0_3px_rgba(255,195,0,0.15)] transition group-hover:scale-105"
      />
      {!compacto && (
        <span className="font-extrabold text-xl tracking-tight text-white">
          Reboque<span className="text-primary-400">Já</span>
        </span>
      )}
    </Link>
  );
}

/* ===================== Barra lateral ===================== */

export function BarraLateralAdmin({
  variante = "lateral",
}: {
  variante?: "lateral" | "topo";
}) {
  const pathname = usePathname();
  const { sair, aSair } = useSair();
  const topo = variante === "topo";
  const activo = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  if (topo) {
    // Mobile / tablet: barra horizontal com scroll
    return (
      <div className="h-14 flex items-center gap-2 px-3 bg-neutral-950/90 backdrop-blur-md border-b border-white/10 overflow-x-auto no-scrollbar">
        <Logo compacto />
        <nav className="flex items-center gap-1">
          {ITENS.map(({ href, rotulo, exact, icone: Icone }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                activo(href, exact)
                  ? "bg-primary-400 text-neutral-950"
                  : "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <Icone className="w-4 h-4" />
              {rotulo}
            </Link>
          ))}
        </nav>
        <button
          onClick={sair}
          disabled={aSair}
          aria-label="Sair"
          className="ml-auto shrink-0 w-10 h-10 grid place-items-center rounded-full text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
        >
          <IconeSair className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-neutral-950 border-r border-white/10">
      <div className="h-16 px-5 flex items-center border-b border-white/10">
        <Logo />
      </div>

      <nav className="flex-1 flex flex-col px-3 py-5 gap-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          Menu
        </p>
        {ITENS.map(({ href, rotulo, exact, icone: Icone }) => {
          const a = activo(href, exact);
          return (
            <Link
              key={href}
              href={href}
              aria-current={a ? "page" : undefined}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                a
                  ? "bg-gradient-to-r from-primary-400/20 to-primary-400/5 text-primary-400 border border-primary-400/25 shadow-[0_4px_20px_-8px_rgba(255,195,0,0.45)]"
                  : "text-neutral-400 hover:text-white hover:bg-white/[0.05] border border-transparent"
              }`}
            >
              {a && (
                <span aria-hidden className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-primary-400" />
              )}
              <Icone className="w-5 h-5" />
              {rotulo}
            </Link>
          );
        })}
      </nav>

      {/* Cartão motivacional */}
      <div className="p-3">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-primary-400/15 via-neutral-900 to-neutral-950 p-5 min-h-[170px]">
          <IconeFoguete className="relative w-9 h-9 text-primary-400" />
          <p className="relative mt-3 text-sm font-semibold text-neutral-100 leading-snug">
            Juntos por um <br /> reboque mais rápido!
          </p>
          <span aria-hidden className="relative mt-3 block w-10 h-0.5 rounded-full bg-primary-400" />
          {/* Ondas */}
          <svg aria-hidden viewBox="0 0 200 60" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 w-full h-14">
            <path d="M0 40 C40 20 80 55 120 35 S180 25 200 30 V60 H0Z" fill="rgba(255,195,0,0.18)" />
            <path d="M0 48 C50 30 90 60 140 42 S185 38 200 42 V60 H0Z" fill="rgba(255,195,0,0.35)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ===================== Barra de topo (desktop) ===================== */

export function BarraTopoAdmin() {
  const router = useRouter();
  const pathname = usePathname();
  const { sair, aSair } = useSair();
  const [nome, setNome] = useState("Administrador");
  const [pendentes, setPendentes] = useState(0);
  const [termo, setTermo] = useState("");
  const [focado, setFocado] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/sessao", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d?.logado && setNome(String(d.nome)))
      .catch(() => {});
  }, []);

  // Empresas à espera de aprovação → notificação
  useEffect(() => {
    fetch("/api/admin/empresas", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const lista: { estadoAprovacao: string }[] = d?.empresas ?? [];
        setPendentes(lista.filter((e) => e.estadoAprovacao === "PENDENTE").length);
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    setMenu(false);
    setTermo("");
  }, [pathname]);

  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  // Pesquisa rápida entre as secções do painel
  const resultados = termo.trim()
    ? ITENS.filter((i) => i.rotulo.toLowerCase().includes(termo.trim().toLowerCase()))
    : [];

  const inicial = nome.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-16 bg-neutral-950/85 backdrop-blur-md border-b border-white/10">
      <div className="h-full px-6 lg:px-8 flex items-center gap-4">
        {/* Pesquisa */}
        <div className="relative w-full max-w-md">
          <IconeLupa className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral-500 pointer-events-none" />
          <input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            onFocus={() => setFocado(true)}
            onBlur={() => setTimeout(() => setFocado(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && resultados[0]) router.push(resultados[0].href);
            }}
            placeholder="Pesquisar no painel…"
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-primary-400/60 focus:ring-2 focus:ring-primary-400/20 transition"
          />
          {focado && resultados.length > 0 && (
            <div className="absolute mt-2 w-full rounded-xl border border-white/10 bg-neutral-900 shadow-2xl overflow-hidden">
              {resultados.map(({ href, rotulo, icone: Icone }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/[0.06] hover:text-white"
                >
                  <Icone className="w-4 h-4 text-primary-400" />
                  {rotulo}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Notificações */}
          <Link
            href="/admin/empresas"
            title={
              pendentes > 0
                ? `${pendentes} empresa(s) à espera de aprovação`
                : "Sem notificações"
            }
            className="relative w-10 h-10 grid place-items-center rounded-full text-neutral-300 hover:text-primary-400 hover:bg-white/[0.06] transition"
          >
            <IconeSino className="w-5 h-5" />
            {pendentes > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-primary-400 text-neutral-950 text-[10px] font-extrabold grid place-items-center ring-2 ring-neutral-950">
                {pendentes}
              </span>
            )}
          </Link>

          <span aria-hidden className="w-px h-8 bg-white/10 mx-2" />

          {/* Utilizador */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenu((v) => !v)}
              aria-expanded={menu}
              className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-xl hover:bg-white/[0.05] transition"
            >
              <span className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-300 to-primary-500 text-neutral-950 grid place-items-center font-extrabold ring-2 ring-primary-400/30">
                {inicial}
              </span>
              <span className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-sm font-semibold text-white max-w-[140px] truncate">{nome}</span>
                <span className="text-[11px] text-neutral-400">Admin</span>
              </span>
              <IconeSeta className={`w-4 h-4 text-neutral-400 transition ${menu ? "rotate-180" : ""}`} />
            </button>
            {menu && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-white/10 bg-neutral-900 shadow-2xl p-1.5">
                <Link
                  href="/"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-neutral-300 hover:bg-white/[0.06] hover:text-white"
                >
                  <IconeCasa className="w-4 h-4" /> Ver site público
                </Link>
                <button
                  onClick={sair}
                  disabled={aSair}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                >
                  <IconeSair className="w-4 h-4" /> {aSair ? "A sair…" : "Terminar sessão"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ===== Ícones ===== */

type P = React.SVGProps<SVGSVGElement>;
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconeCasa(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}
function IconePredio(props: P) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M9 7h1.5M13.5 7H15M9 11h1.5M13.5 11H15M9 15h1.5M13.5 15H15" />
      <path d="M10.5 21v-3h3v3" />
    </svg>
  );
}
function IconeCaixa(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M21 8.5v7L12 21l-9-5.5v-7L12 3l9 5.5Z" />
      <path d="M3.3 8.6 12 13.5l8.7-4.9" />
      <path d="M12 13.5V21" />
    </svg>
  );
}
function IconePessoas(props: P) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c1.2-3.2 3.6-5 6.5-5s5.3 1.8 6.5 5" />
      <path d="M16 5a3.5 3.5 0 0 1 0 7" />
      <path d="M18.5 15.5c1.6.8 2.7 2.3 3.3 4.5" />
    </svg>
  );
}
function IconeEstrela(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="m12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.9 6.4 20l1.3-6.2L3 9.5l6.3-.7L12 3Z" />
    </svg>
  );
}
function IconeSair(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
function IconeLupa(props: P) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function IconeSino(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 19a2.5 2.5 0 0 0 4 0" />
    </svg>
  );
}
function IconeSeta(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function IconeFoguete(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1Z" />
      <path d="M12 15 9 12a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2Z" />
      <path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0" />
      <path d="M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5" />
    </svg>
  );
}
