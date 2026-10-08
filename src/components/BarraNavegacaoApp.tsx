"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { usarTema } from "./ProvedorTema";

type IconeNav = (props: React.SVGProps<SVGSVGElement>) => JSX.Element;

const ITENS_APP: Record<"CONDUTOR" | "EMPRESA" | "ADMIN", { href: string; rotulo: string; icone: IconeNav }[]> = {
  CONDUTOR: [
    { href: "/app", rotulo: "Pedir reboque", icone: NavIconePin },
    { href: "/app/historico", rotulo: "Histórico", icone: NavIconeRecibo },
    { href: "/app/perfil", rotulo: "Perfil", icone: NavIconeUtilizador },
    { href: "/app/avaliacao-prototipo", rotulo: "Avaliar", icone: NavIconeEstrela },
  ],
  EMPRESA: [
    { href: "/empresa", rotulo: "Painel", icone: NavIconePainel },
    { href: "/empresa/camioes", rotulo: "Camiões", icone: NavIconeCamiao },
    { href: "/empresa/precos", rotulo: "Preços", icone: NavIconeEtiqueta },
    { href: "/empresa/historico", rotulo: "Histórico", icone: NavIconeRecibo },
    { href: "/empresa/perfil", rotulo: "Perfil", icone: NavIconePredio },
    { href: "/empresa/avaliacao-prototipo", rotulo: "Avaliar", icone: NavIconeEstrela },
  ],
  ADMIN: [
    { href: "/admin", rotulo: "Dashboard", icone: NavIconePainel },
    { href: "/admin/empresas", rotulo: "Empresas", icone: NavIconePredio },
    { href: "/admin/pedidos", rotulo: "Pedidos", icone: NavIconeRecibo },
    { href: "/admin/utilizadores", rotulo: "Utilizadores", icone: NavIconeUtilizador },
    { href: "/admin/avaliacoes", rotulo: "Avaliações", icone: NavIconeEstrela },
  ],
};

const ROTULO_PAPEL_APP: Record<string, string> = {
  CONDUTOR: "Condutor",
  EMPRESA: "Empresa",
  ADMIN: "Administrador",
};

export function BarraNavegacaoApp({
  papel,
}: {
  papel: "CONDUTOR" | "EMPRESA" | "ADMIN";
}) {
  const { tema, alternar } = usarTema();
  const pathname = usePathname();
  const [nome, setNome] = useState("");
  const [menu, setMenu] = useState(false);
  const [aSair, setASair] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const itens = ITENS_APP[papel];
  const base = itens[0].href;

  useEffect(() => {
    fetch("/api/sessao", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d?.logado && setNome(String(d.nome)))
      .catch(() => {});
  }, []);

  useEffect(() => setMenu(false), [pathname]);

  // Condutor: o sino indica um pedido em curso
  const [pedidoActivo, setPedidoActivo] = useState<string | null>(null);
  useEffect(() => {
    if (papel !== "CONDUTOR") return;
    fetch("/api/minha-conta/pedidos", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const activos = ["PENDENTE", "ACEITE", "A_CAMINHO", "NO_LOCAL", "EM_TRANSPORTE"];
        const p = (d?.pedidos as { id: string; estado: string }[] | undefined)?.find((x) => activos.includes(x.estado));
        setPedidoActivo(p ? p.id : null);
      })
      .catch(() => {});
  }, [papel, pathname]);

  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  const sair = async () => {
    setASair(true);
    await fetch("/api/sair", { method: "POST" });
    window.location.href = "/";
  };

  // O item base (/app, /empresa) só fica activo na rota exacta ou em sub-rotas
  // que não pertençam a outro item do menu.
  const estaActivo = (href: string) => {
    if (href === base) {
      return (
        pathname === base ||
        (pathname.startsWith(base + "/") &&
          !itens.some((i) => i.href !== base && pathname.startsWith(i.href)))
      );
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const primeiroNome = nome.split(" ")[0];
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const inicial = (
    partes.length > 1
      ? partes[0][0] + partes[partes.length - 1][0]
      : (partes[0] || ROTULO_PAPEL_APP[papel]).slice(0, 1)
  ).toUpperCase();

  return (
    <nav className="sticky top-0 z-40 h-14 bg-neutral-950/90 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/20">
      <div className="max-w-6xl mx-auto h-full px-3 sm:px-6 flex items-center gap-2 sm:gap-4">
        {/* Logo */}
        <Link href={base} className="group flex items-center gap-2.5 shrink-0" aria-label="ReboqueJá">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt=""
            className="w-8 h-8 rounded-lg shadow-[0_0_0_3px_rgba(255,195,0,0.15)] transition group-hover:scale-105"
          />
          <span className="hidden md:inline font-extrabold text-lg tracking-tight text-white">
            Reboque<span className="text-primary-400">Já</span>
          </span>
        </Link>

        {/* Navegação em cápsula */}
        <div className="flex-1 min-w-0 flex justify-center">
          <div className="h-14 flex items-stretch gap-1 overflow-x-auto no-scrollbar max-w-full">
            {itens.map(({ href, rotulo, icone: Icone }) => {
              const activo = estaActivo(href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={rotulo}
                  aria-label={rotulo}
                  aria-current={activo ? "page" : undefined}
                  className={`relative flex items-center gap-2 px-3 sm:px-4 text-sm font-semibold whitespace-nowrap transition ${
                    activo ? "text-primary-400" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Icone className="w-5 h-5 shrink-0" />
                  <span className={activo ? "inline" : "hidden md:inline"}>{rotulo}</span>
                  <span
                    aria-hidden
                    className={`absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full transition ${
                      activo ? "bg-primary-400 shadow-[0_0_12px_rgba(255,195,0,0.7)]" : "bg-transparent"
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Tema + utilizador */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={alternar}
            aria-label="Alternar tema"
            title={tema === "escuro" ? "Modo claro" : "Modo escuro"}
            className="hidden sm:grid w-9 h-9 place-items-center rounded-full text-neutral-300 hover:text-primary-400 hover:bg-white/[0.06] transition"
          >
            {tema === "escuro" ? <NavIconeSol className="w-5 h-5" /> : <NavIconeLua className="w-5 h-5" />}
          </button>

          {papel === "CONDUTOR" && (
            <Link
              href={pedidoActivo ? `/app/pedido/${pedidoActivo}` : "/app/historico"}
              title={pedidoActivo ? "Tem um pedido em curso" : "Sem pedidos em curso"}
              aria-label="Notificações"
              className="relative w-9 h-9 grid place-items-center rounded-full text-neutral-300 hover:text-primary-400 hover:bg-white/[0.06] transition"
            >
              <NavIconeSino className="w-5 h-5" />
              {pedidoActivo && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-primary-400 ring-2 ring-neutral-950 animate-pulse" />
              )}
            </Link>
          )}

          <span aria-hidden className="hidden sm:block w-px h-7 bg-white/10 mx-1.5" />

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenu((v) => !v)}
              aria-expanded={menu}
              aria-label="Menu da conta"
              className="flex items-center gap-2 pl-1 pr-1.5 sm:pr-2 py-1 rounded-full hover:bg-white/[0.06] transition"
            >
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-300 to-primary-500 text-neutral-950 grid place-items-center text-sm font-extrabold ring-2 ring-primary-400/30">
                {inicial}
              </span>
              <span className="hidden md:flex flex-col items-start leading-tight">
                <span className="text-sm font-semibold text-white max-w-[110px] truncate">
                  {primeiroNome || "…"}
                </span>
                <span className="text-[11px] text-neutral-400">{ROTULO_PAPEL_APP[papel]}</span>
              </span>
              <NavIconeSeta className={`hidden sm:block w-4 h-4 text-neutral-400 transition ${menu ? "rotate-180" : ""}`} />
            </button>

            {menu && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl p-1.5">
                <div className="px-3 py-2.5 mb-1 border-b border-white/10">
                  <p className="text-sm font-semibold text-white truncate">{nome || "—"}</p>
                  <p className="text-xs text-neutral-400">{ROTULO_PAPEL_APP[papel]}</p>
                </div>
                <button
                  onClick={alternar}
                  className="sm:hidden w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-neutral-300 hover:bg-white/[0.06] hover:text-white"
                >
                  {tema === "escuro" ? <NavIconeSol className="w-4 h-4" /> : <NavIconeLua className="w-4 h-4" />}
                  {tema === "escuro" ? "Modo claro" : "Modo escuro"}
                </button>
                <Link
                  href="/"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-neutral-300 hover:bg-white/[0.06] hover:text-white"
                >
                  <NavIconeCasa className="w-4 h-4" /> Ver site público
                </Link>
                <button
                  onClick={sair}
                  disabled={aSair}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                >
                  <NavIconeSair className="w-4 h-4" /> {aSair ? "A sair…" : "Terminar sessão"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ===== Ícones da navbar da app ===== */

const navSvg = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
type NP = React.SVGProps<SVGSVGElement>;

function NavIconePin(p: NP) {
  return (<svg {...navSvg} {...p}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>);
}
function NavIconeRecibo(p: NP) {
  return (<svg {...navSvg} {...p}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>);
}
function NavIconeUtilizador(p: NP) {
  return (<svg {...navSvg} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>);
}
function NavIconeEstrela(p: NP) {
  return (<svg {...navSvg} {...p}><path d="m12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.9 6.4 20l1.3-6.2L3 9.5l6.3-.7L12 3Z" /></svg>);
}
function NavIconePainel(p: NP) {
  return (<svg {...navSvg} {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>);
}
function NavIconeCamiao(p: NP) {
  return (<svg {...navSvg} {...p}><path d="M2 16V6h11v10" /><path d="M13 9h4l4 4v3h-8" /><circle cx="7" cy="17.5" r="2" /><circle cx="17" cy="17.5" r="2" /></svg>);
}
function NavIconeEtiqueta(p: NP) {
  return (<svg {...navSvg} {...p}><path d="M3 12V4h8l10 10-8 8L3 12Z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>);
}
function NavIconePredio(p: NP) {
  return (<svg {...navSvg} {...p}><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M9 7h1.5M13.5 7H15M9 11h1.5M13.5 11H15M9 15h1.5M13.5 15H15" /><path d="M10.5 21v-3h3v3" /></svg>);
}
function NavIconeCasa(p: NP) {
  return (<svg {...navSvg} {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>);
}
function NavIconeSair(p: NP) {
  return (<svg {...navSvg} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>);
}
function NavIconeSino(p: NP) {
  return (<svg {...navSvg} {...p}><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 19a2.5 2.5 0 0 0 4 0" /></svg>);
}
function NavIconeSeta(p: NP) {
  return (<svg {...navSvg} {...p}><path d="m6 9 6 6 6-6" /></svg>);
}
function NavIconeSol(p: NP) {
  return (<svg {...navSvg} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>);
}
function NavIconeLua(p: NP) {
  return (<svg {...navSvg} {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>);
}

