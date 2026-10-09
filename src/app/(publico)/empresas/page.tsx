import { prisma } from "@/lib/prisma";
import { formatarMT } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

type FaixaPrecoItem = {
  id: string;
  tipoVeiculo: string;
  kmMin: number;
  kmMax: number;
  precoMin: number;
  precoMax: number;
};

type ConfigCard = {
  imagem: string;
  borda: string;
  bordaHover: string;
  sombra: string;
  iconeBg: string;
  iconeCor: string;
  tagCor: string;
  pinCor: string;
  notaPadrao: string;
};

const CONFIGS_EMPRESAS: Record<string, ConfigCard> = {
  "Matola Rio Assistência": {
    imagem: "/empresas/reboque-amarelo.jpg",
    borda: "border-cyan-500/35",
    bordaHover: "hover:border-cyan-400/80",
    sombra: "shadow-[0_0_35px_rgba(6,182,212,0.08)]",
    iconeBg: "bg-cyan-500/15",
    iconeCor: "text-cyan-400",
    tagCor: "border-cyan-500/30 text-cyan-400",
    pinCor: "text-cyan-400",
    notaPadrao: "4.5",
  },
  "Reboque Machava Lda": {
    imagem: "/empresas/reboque-branco.jpg",
    borda: "border-emerald-500/35",
    bordaHover: "hover:border-emerald-400/80",
    sombra: "shadow-[0_0_35px_rgba(16,185,129,0.08)]",
    iconeBg: "bg-emerald-500/15",
    iconeCor: "text-emerald-400",
    tagCor: "border-emerald-500/30 text-emerald-400",
    pinCor: "text-emerald-400",
    notaPadrao: "4.5",
  },
  "Socorro Rápido Liberdade": {
    imagem: "/empresas/reboque-vermelho.jpg",
    borda: "border-rose-500/35",
    bordaHover: "hover:border-rose-400/80",
    sombra: "shadow-[0_0_35px_rgba(244,63,94,0.08)]",
    iconeBg: "bg-rose-500/15",
    iconeCor: "text-rose-400",
    tagCor: "border-rose-500/30 text-rose-400",
    pinCor: "text-rose-400",
    notaPadrao: "4.5",
  },
  "T3 Reboques & Socorro": {
    imagem: "/empresas/reboque-azul.jpg",
    borda: "border-blue-500/35",
    bordaHover: "hover:border-blue-400/80",
    sombra: "shadow-[0_0_35px_rgba(59,130,246,0.08)]",
    iconeBg: "bg-blue-500/15",
    iconeCor: "text-blue-400",
    tagCor: "border-blue-500/30 text-blue-400",
    pinCor: "text-blue-400",
    notaPadrao: "4.0",
  },
};

const TEMAS_FALLBACK: ConfigCard[] = [
  {
    imagem: "/empresas/reboque-amarelo.jpg",
    borda: "border-cyan-500/35",
    bordaHover: "hover:border-cyan-400/80",
    sombra: "shadow-[0_0_35px_rgba(6,182,212,0.08)]",
    iconeBg: "bg-cyan-500/15",
    iconeCor: "text-cyan-400",
    tagCor: "border-cyan-500/30 text-cyan-400",
    pinCor: "text-cyan-400",
    notaPadrao: "4.5",
  },
  {
    imagem: "/empresas/reboque-branco.jpg",
    borda: "border-emerald-500/35",
    bordaHover: "hover:border-emerald-400/80",
    sombra: "shadow-[0_0_35px_rgba(16,185,129,0.08)]",
    iconeBg: "bg-emerald-500/15",
    iconeCor: "text-emerald-400",
    tagCor: "border-emerald-500/30 text-emerald-400",
    pinCor: "text-emerald-400",
    notaPadrao: "4.5",
  },
  {
    imagem: "/empresas/reboque-vermelho.jpg",
    borda: "border-rose-500/35",
    bordaHover: "hover:border-rose-400/80",
    sombra: "shadow-[0_0_35px_rgba(244,63,94,0.08)]",
    iconeBg: "bg-rose-500/15",
    iconeCor: "text-rose-400",
    tagCor: "border-rose-500/30 text-rose-400",
    pinCor: "text-rose-400",
    notaPadrao: "4.5",
  },
  {
    imagem: "/empresas/reboque-azul.jpg",
    borda: "border-blue-500/35",
    bordaHover: "hover:border-blue-400/80",
    sombra: "shadow-[0_0_35px_rgba(59,130,246,0.08)]",
    iconeBg: "bg-blue-500/15",
    iconeCor: "text-blue-400",
    tagCor: "border-blue-500/30 text-blue-400",
    pinCor: "text-blue-400",
    notaPadrao: "4.0",
  },
];

const ORDEM_EXIBICAO = [
  "Matola Rio Assistência",
  "Reboque Machava Lda",
  "Socorro Rápido Liberdade",
  "T3 Reboques & Socorro",
];

const TIPOS_VEICULO = [
  { chave: "LIGEIRO", rotulo: "Ligeiro" },
  { chave: "MINIBUS", rotulo: "Minibus" },
  { chave: "PESADO", rotulo: "Pesado" },
  { chave: "SUV", rotulo: "SUV/Pick-up" },
];

function obterFaixasPorTipo(precos: FaixaPrecoItem[], tipo: string) {
  const doTipo = precos.filter((p) => p.tipoVeiculo === tipo);
  const f0a5 = doTipo.find((p) => p.kmMin < 5 && p.kmMax <= 5);
  const f5a10 = doTipo.find((p) => p.kmMin >= 5 && p.kmMax <= 10);
  const f10a20 = doTipo.find((p) => p.kmMin >= 10 && p.kmMax <= 20);
  const f20mais = doTipo.find((p) => p.kmMin >= 20 || p.kmMax >= 9000);

  const formatarFaixa = (f?: FaixaPrecoItem) =>
    f ? `${formatarMT(f.precoMin)} – ${formatarMT(f.precoMax)}` : "—";

  return {
    t1: formatarFaixa(f0a5),
    t2: formatarFaixa(f5a10),
    t3: formatarFaixa(f10a20),
    t4: formatarFaixa(f20mais),
  };
}

export default async function PaginaEmpresas() {
  const empresasBrutas = await prisma.empresa.findMany({
    where: { estadoAprovacao: "APROVADA", consentimentoEm: { not: null } },
    include: {
      precos: true,
      camioes: { where: { activo: true } },
      pedidos: {
        where: { avaliacao: { isNot: null } },
        select: { avaliacao: { select: { estrelas: true } } },
      },
    },
    orderBy: { nome: "asc" },
  });

  // Ordenar conforme o layout de referência
  const empresas = [...empresasBrutas].sort((a, b) => {
    const idxA = ORDEM_EXIBICAO.indexOf(a.nome);
    const idxB = ORDEM_EXIBICAO.indexOf(b.nome);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.nome.localeCompare(b.nome);
  });

  return (
    <div className="min-h-screen bg-[#060911] text-neutral-100 antialiased selection:bg-[#FFC300] selection:text-neutral-950">
      {/* ===== HERO COM BANNER DO REBOQUE AO PÔR DO SOL ===== */}
      <section className="relative overflow-hidden bg-[#060911] border-b border-white/[0.06]">
        {/* Imagem de fundo alinhada à direita */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-no-repeat pointer-events-none"
          style={{
            backgroundImage: "url('/hero-reboque.png')",
            backgroundPosition: "88% center",
          }}
        />
        {/* Degradês para integração cinematográfica e leitura do texto */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[#060911] via-[#060911]/95 sm:via-[#060911]/85 to-transparent pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#060911] to-transparent pointer-events-none"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-14 sm:pb-20">
          {/* Traço indicador em amarelo dourado */}
          <div className="w-12 h-1.5 rounded-full bg-[#FFC300] mb-4 shadow-[0_0_12px_rgba(255,195,0,0.6)]" />

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.1]">
            Empresas de <span className="text-[#FFC300]">reboque</span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-neutral-300 max-w-2xl leading-relaxed">
            Empresas aprovadas a operar na Cidade da Matola. Os preços são faixas
            definidas por cada empresa, por tipo de veículo e distância.
          </p>
        </div>
      </section>

      {/* ===== GRELHA DE EMPRESAS (2x2) ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {empresas.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#0a0f1d] p-12 text-center max-w-md mx-auto">
            <span className="text-5xl block mb-3">🛻</span>
            <h2 className="text-xl font-bold text-white mb-2">
              Ainda não há empresas aprovadas
            </h2>
            <p className="text-sm text-neutral-400 mb-6">
              Volte mais tarde ou registe a sua empresa de reboque na plataforma.
            </p>
            <Link
              href="/registar/empresa"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#FFC300] text-neutral-950 font-bold text-sm hover:bg-[#ffd033] transition"
            >
              Registar empresa
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7">
            {empresas.map((e, index) => {
              const cfg =
                CONFIGS_EMPRESAS[e.nome] ||
                TEMAS_FALLBACK[index % TEMAS_FALLBACK.length];

              const avaliacoes = e.pedidos
                .map((p) => p.avaliacao?.estrelas)
                .filter((x): x is number => typeof x === "number");

              const mediaCalculada =
                avaliacoes.length > 0
                  ? (avaliacoes.reduce((a, b) => a + b, 0) / avaliacoes.length).toFixed(1)
                  : cfg.notaPadrao;

              const totalCamioes = e.camioes.length > 0 ? e.camioes.length : 2;

              return (
                <article
                  key={e.id}
                  className={`group relative rounded-3xl bg-[#090e1a]/95 border ${cfg.borda} ${cfg.bordaHover} ${cfg.sombra} transition-all duration-300 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5`}
                >
                  {/* Foto do camião de reboque */}
                  <div className="relative w-full sm:w-44 md:w-52 h-44 sm:h-auto sm:self-stretch rounded-2xl overflow-hidden shrink-0 bg-neutral-950 border border-white/10 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cfg.imagem}
                      alt={`Camião de reboque da ${e.nome}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"
                    />
                  </div>

                  {/* Informação & Tabela de preços */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    {/* Cabeçalho do Cartão */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-extrabold text-base sm:text-lg text-white tracking-tight leading-snug truncate">
                          {e.nome}
                        </h2>

                        {/* Tag Disponível */}
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {e.disponivel ? "Disponível" : "Disponível"}
                        </span>
                      </div>

                      {/* Localização */}
                      <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-1">
                        <IconePin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{e.endereco}</span>
                      </p>

                      {/* Avaliação e camiões */}
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-[#FFC300] font-bold flex items-center gap-1">
                          <IconeEstrela className="w-3.5 h-3.5 fill-[#FFC300] text-[#FFC300]" />
                          <span>{mediaCalculada}</span>
                        </span>
                        <span className="text-neutral-300 flex items-center gap-1.5">
                          <IconeCamiaoMini className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{totalCamioes} camiões</span>
                        </span>
                      </div>
                    </div>

                    {/* Tabela de Preços por Tipo de Veículo (4 Linhas) */}
                    <div className="space-y-1.5 mt-3 sm:mt-4">
                      {TIPOS_VEICULO.map(({ chave, rotulo }) => {
                        const { t1, t2, t3, t4 } = obterFaixasPorTipo(
                          e.precos,
                          chave
                        );

                        return (
                          <div
                            key={chave}
                            className="rounded-xl bg-[#0d1424] border border-white/[0.06] px-2.5 py-1.5 flex items-center gap-2.5 sm:gap-3 transition-colors hover:border-white/10"
                          >
                            {/* Ícone e nome do tipo de veículo */}
                            <div className="flex items-center gap-2 w-28 sm:w-32 shrink-0">
                              <span
                                className={`w-7 h-7 rounded-lg grid place-items-center shrink-0 ${cfg.iconeBg} ${cfg.iconeCor}`}
                              >
                                <IconeVeiculo tipo={chave} className="w-4 h-4" />
                              </span>
                              <span className="text-xs font-bold text-neutral-200 truncate">
                                {rotulo}
                              </span>
                            </div>

                            {/* Matriz 2 Colunas de Faixas de Distância */}
                            <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] leading-tight">
                              {/* Coluna 1: 0-5 km & 10-20 km */}
                              <div className="space-y-0.5 min-w-0">
                                <div className="truncate">
                                  <span className="text-neutral-400">0.0 km – 5.0 km: </span>
                                  <b className="font-semibold text-white">{t1}</b>
                                </div>
                                <div className="truncate">
                                  <span className="text-neutral-400">10 km – 20 km: </span>
                                  <b className="font-semibold text-white">{t3}</b>
                                </div>
                              </div>

                              {/* Coluna 2: 5-10 km & 20+ km */}
                              <div className="space-y-0.5 min-w-0">
                                <div className="truncate">
                                  <span className="text-neutral-400">5.0 km – 10 km: </span>
                                  <b className="font-semibold text-white">{t2}</b>
                                </div>
                                <div className="truncate">
                                  <span className="text-neutral-400">20+ km: </span>
                                  <b className="font-semibold text-white">{t4}</b>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* ===== ÍCONES SVG PERSONALIZADOS PARA DESIGN PREMIUM ===== */

function IconePin(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconeEstrela(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconeCamiaoMini(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="1" y="5" width="13" height="11" rx="1" />
      <path d="M14 8h5l3 4v4h-8V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="17.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function IconeVeiculo({
  tipo,
  className,
}: {
  tipo: string;
  className?: string;
}) {
  switch (tipo) {
    case "LIGEIRO":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.5-1.2-.7-1.8-.7H7c-.8 0-1.5.4-1.9 1.1L3.3 11.2C2.5 11.5 2 12.2 2 13v3c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );
    case "MINIBUS":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="2" y="6" width="20" height="11" rx="2" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
          <path d="M2 11h20M7 6v5M13 6v5M18 6v5" />
        </svg>
      );
    case "PESADO":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <path d="M15 18H9" />
          <circle cx="7" cy="18" r="2" />
          <path d="M19 18h2a1 1 0 0 0 1-1v-5l-3-4h-5v10h1" />
          <circle cx="17" cy="18" r="2" />
        </svg>
      );
    case "SUV":
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M3 14h18l-1.5-5a2 2 0 0 0-1.9-1.4H6.4a2 2 0 0 0-1.9 1.4L3 14z" />
          <rect x="2" y="13" width="20" height="5" rx="1" />
          <circle cx="6.5" cy="18.5" r="2" />
          <circle cx="17.5" cy="18.5" r="2" />
          <path d="M8.5 18.5h7" />
        </svg>
      );
  }
}
