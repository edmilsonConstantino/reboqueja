"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Building2,
  ChevronRight,
  MapPin,
  PhoneCall,
  Play,
  Search,
  ShieldCheck,
  Star,
  Truck,
  Zap,
} from "lucide-react";

const PASSOS = [
  {
    numero: "1",
    titulo: "Marque a localização",
    descricao:
      "Informe onde o veículo se encontra e, se necessário, o destino.",
    icone: MapPin,
  },
  {
    numero: "2",
    titulo: "Compare as empresas",
    descricao: "Veja as opções disponíveis na Matola e compare preços.",
    icone: Search,
  },
  {
    numero: "3",
    titulo: "Acompanhe e contacte",
    descricao: "Escolha a melhor opção e contacte directamente.",
    icone: PhoneCall,
  },
];

const EMPRESAS_DESTAQUE = [
  {
    nome: "Matola Rio Assistência",
    bairro: "Matola",
    nota: "4.8",
    avaliacoes: "120 avaliações",
    imagem: "/empresas/reboque-amarelo.jpg",
  },
  {
    nome: "Reboque Machava Lda",
    bairro: "Machava",
    nota: "4.7",
    avaliacoes: "98 avaliações",
    imagem: "/empresas/reboque-branco.jpg",
  },
  {
    nome: "Socorro Rápido Liberdade",
    bairro: "Liberdade",
    nota: "4.6",
    avaliacoes: "75 avaliações",
    imagem: "/empresas/reboque-vermelho.jpg",
  },
  {
    nome: "T3 Reboques & Socorro",
    bairro: "Matola",
    nota: "4.5",
    avaliacoes: "62 avaliações",
    imagem: "/empresas/reboque-azul.jpg",
  },
];

const METRICAS_COBERTURA = [
  {
    valor: "+50",
    rotulo: "Empresas parceiras",
    icone: Truck,
  },
  {
    valor: "< 5 min",
    rotulo: "Tempo médio de resposta",
    icone: Zap,
  },
  {
    valor: "100%",
    rotulo: "Serviço seguro",
    icone: ShieldCheck,
  },
];

export default function Landing() {
  const [imagensComErro, setImagensComErro] = useState<Record<string, boolean>>({});

  return (
    <div className="bg-[#FAF7F2] text-[#1E120B] dark:bg-[#0C0603] dark:text-[#F5EDE4] antialiased selection:bg-[#D97706] selection:text-white transition-colors duration-200">
      {/* ===== SECÇÃO 1: HERO ===== */}
      <section className="relative overflow-hidden bg-[#FAF7F2] dark:bg-[#0C0603] border-b border-[#E5D6C3] dark:border-[#3A2212]/70">
        {/* Fotografia de fundo alinhada à direita */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-no-repeat pointer-events-none"
          style={{
            backgroundImage: "url('/hero-reboque.png')",
            backgroundPosition: "85% center",
          }}
        />

        {/* Scrim direcional de contraste (claro: creme-marfim; escuro: expresso profundo) */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2] via-[#FAF7F2]/95 sm:via-[#FAF7F2]/85 to-[#FAF7F2]/10 dark:from-[#0C0603] dark:via-[#0C0603]/90 sm:dark:via-[#0C0603]/80 dark:to-transparent pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#FAF7F2] dark:from-[#0C0603] to-transparent pointer-events-none"
        />

        {/* Curvas orgânicas laterais em bronze/âmbar */}
        <svg
          aria-hidden
          viewBox="0 0 600 500"
          className="absolute -left-24 top-0 h-full w-[460px] pointer-events-none opacity-35 dark:opacity-30"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 C160,120 80,260 260,360 C130,380 40,440 0,500 Z"
            className="fill-[#C98A54] dark:fill-[#B45309]"
          />
          <path
            d="M0,80 C210,190 120,320 340,450 L0,500 Z"
            className="fill-[#E7CFB5] dark:fill-[#78350F]/60"
          />
        </svg>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-16 sm:pb-24">
          <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#9A4D0D]/12 border border-[#9A4D0D]/25 dark:bg-[#F59E0B]/15 dark:border-[#F59E0B]/30 mb-4">
            <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#8C4308] dark:text-[#FBBF24]">
              Serviço de reboque na Matola
            </span>
          </div>

          <h1 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-extrabold text-[#1A100A] dark:text-white tracking-tight leading-[1.08] max-w-2xl [text-wrap:balance]">
            O veículo avariou?
            <br />
            <span className="text-[#9A4D0D] dark:text-[#F59E0B]">
              O reboque chega já.
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-[#594637] dark:text-[#D1C0AE] max-w-xl leading-relaxed">
            O ReboqueJá liga-o às empresas de reboque da Cidade da Matola em
            minutos. Veja a lista de preço antes de pedir, acompanhe o caminho
            no mapa e pague como preferir.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/registar"
              className="min-h-[46px] px-6 py-2.5 rounded-full bg-gradient-to-r from-[#A45312] to-[#7C3B0B] hover:from-[#B45C15] hover:to-[#8B430E] text-white dark:from-[#F59E0B] dark:to-[#B45309] dark:hover:from-[#FBBF24] dark:hover:to-[#D97706] dark:text-[#140B05] font-bold text-sm inline-flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-lg shadow-[#9A4D0D]/25 dark:shadow-[#F59E0B]/20 whitespace-nowrap shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Pedir reboque</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/empresas"
              className="min-h-[46px] px-5 py-2.5 rounded-full border border-[#D4C1AC] bg-white/85 text-[#2C1C12] hover:bg-white dark:border-[#5C3921] dark:bg-[#1C1009]/80 dark:text-[#F5EDE4] dark:hover:bg-[#2A180D] backdrop-blur-md font-semibold text-sm inline-flex items-center justify-center gap-2 transition whitespace-nowrap shrink-0"
            >
              <Building2 className="w-4 h-4 text-[#9A4D0D] dark:text-[#F59E0B]" />
              <span>Ver empresas</span>
            </Link>

            <a
              href="#como-funciona"
              className="min-h-[46px] px-5 py-2.5 rounded-full border border-[#DECDBE] bg-[#F5EDE2]/85 text-[#4A3728] hover:bg-white dark:border-[#492C19] dark:bg-[#170E08]/75 dark:text-[#DECBB7] dark:hover:bg-[#24150C] backdrop-blur-md font-semibold text-sm inline-flex items-center justify-center gap-2 transition whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current text-[#9A4D0D] dark:text-[#F59E0B]" />
              <span>Como funciona</span>
            </a>
          </div>
        </div>
      </section>

      {/* ===== SECÇÃO 2: COMO FUNCIONA (Fluxo horizontal em 3 etapas com setas) ===== */}
      <section
        id="como-funciona"
        className="relative py-14 sm:py-16 bg-[#F5EFE6]/70 dark:bg-[#120A05] border-b border-[#E5D6C3] dark:border-[#3A2212]/60"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="inline-block px-3.5 py-1 rounded-full bg-[#9A4D0D]/12 text-[#8C4308] dark:bg-[#F59E0B]/15 dark:text-[#FBBF24] text-[11px] font-bold tracking-[0.14em] uppercase mb-3">
              Como funciona
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A100A] dark:text-white tracking-tight [text-wrap:balance]">
              É simples, rápido e seguro.
            </h2>
            <p className="text-sm text-[#6B5747] dark:text-[#B9A490] mt-1.5">
              Veja como pedir o seu reboque:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-center">
            {PASSOS.map((passo, index) => {
              const Icone = passo.icone;
              return (
                <div key={passo.numero} className="contents">
                  <div className="h-full rounded-2xl bg-white dark:bg-[#1A0F08] border border-[#E5D6C3] dark:border-[#492C19]/80 hover:border-[#C0793B] dark:hover:border-[#F59E0B]/50 p-6 transition shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#A45312] to-[#7C3B0B] dark:from-[#F59E0B] dark:to-[#B45309] text-white dark:text-[#140B05] font-extrabold text-xs grid place-items-center tabular-nums shrink-0">
                        {passo.numero}
                      </span>
                      <span className="w-9 h-9 rounded-xl bg-[#F5EDE2] text-[#9A4D0D] dark:bg-[#2B190D] dark:text-[#F59E0B] grid place-items-center shrink-0">
                        <Icone className="w-4 h-4" />
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-[#1A100A] dark:text-white">
                      {passo.titulo}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6B5747] dark:text-[#B9A490] mt-1.5 leading-relaxed">
                      {passo.descricao}
                    </p>
                  </div>

                  {index < PASSOS.length - 1 && (
                    <div
                      aria-hidden
                      className="hidden md:flex items-center justify-center text-[#B58963] dark:text-[#7C4E29]"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== SECÇÃO 3: EMPRESAS DE REBOQUE CREDENCIADAS ===== */}
      <section className="py-14 sm:py-16 bg-[#FAF7F2] dark:bg-[#0D0704] border-b border-[#E5D6C3] dark:border-[#3A2212]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Bloco introdutório à esquerda */}
            <div className="lg:col-span-4">
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#9A4D0D]/12 text-[#8C4308] dark:bg-[#F59E0B]/15 dark:text-[#FBBF24] text-[11px] font-bold tracking-[0.14em] uppercase mb-3">
                Empresas de reboque
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A100A] dark:text-white tracking-tight leading-tight [text-wrap:balance]">
                Empresas de reboque credenciadas
              </h2>
              <p className="text-sm text-[#6B5747] dark:text-[#B9A490] mt-3 leading-relaxed">
                Operadores prontos a atender na Cidade da Matola com camiões,
                guincho e reboque.
              </p>
              <div className="mt-6">
                <Link
                  href="/empresas"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#A45312] to-[#7C3B0B] hover:from-[#B45C15] hover:to-[#8B430E] text-white dark:bg-none dark:bg-[#1E120A] dark:border dark:border-[#B45309]/60 dark:text-[#FBBF24] dark:hover:bg-[#2A180D] font-bold text-xs sm:text-sm transition whitespace-nowrap shadow-sm"
                >
                  <span>Ver todas as empresas</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Grade de 4 cartões à direita */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {EMPRESAS_DESTAQUE.map((emp) => {
                const falhou = Boolean(imagensComErro[emp.nome]);
                return (
                  <div
                    key={emp.nome}
                    className="group rounded-2xl bg-white dark:bg-[#1A0F08] border border-[#E5D6C3] dark:border-[#492C19]/80 hover:border-[#B45309]/70 dark:hover:border-[#F59E0B]/60 p-3 transition-all duration-200 hover:-translate-y-0.5 shadow-sm dark:shadow-none flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[#EFE4D6] dark:bg-[#28160C] mb-3">
                        {!falhou ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={emp.imagem}
                              alt={emp.nome}
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setImagensComErro((prev) => ({
                                  ...prev,
                                  [emp.nome]: true,
                                }))
                              }
                              className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-[#9A4D0D] dark:text-[#F59E0B]">
                            <Truck className="w-7 h-7" />
                            <span className="text-[11px] font-semibold">
                              {emp.bairro}
                            </span>
                          </div>
                        )}
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-sm">
                          Disponível
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-[#1A100A] dark:text-white truncate">
                        {emp.nome}
                      </h3>

                      <div className="flex items-center gap-1 mt-1.5 text-xs tabular-nums">
                        <Star className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706] dark:fill-[#F59E0B] dark:text-[#F59E0B] shrink-0" />
                        <span className="font-bold text-[#9A4D0D] dark:text-[#F59E0B]">
                          {emp.nota}
                        </span>
                        <span className="text-[#6B5747] dark:text-[#B9A490] truncate">
                          ({emp.avaliacoes})
                        </span>
                      </div>

                      <p className="text-xs text-[#6B5747] dark:text-[#B9A490] flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#9A4D0D] dark:text-[#F59E0B] shrink-0" />
                        <span className="truncate">{emp.bairro}</span>
                      </p>
                    </div>

                    <Link
                      href="/empresas"
                      className="mt-3.5 w-full py-2 px-3 rounded-full bg-gradient-to-r from-[#A45312] to-[#7C3B0B] hover:from-[#B45C15] hover:to-[#8B430E] dark:from-[#92400E] dark:to-[#6B2D07] dark:hover:from-[#B45309] dark:hover:to-[#853A0A] text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition whitespace-nowrap"
                    >
                      <span>Ver detalhes</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECÇÃO 4: COBERTURA NA MATOLA (Texto + Mapa Estilizado + Métricas) ===== */}
      <section className="py-12 sm:py-16 bg-[#F5EFE6]/70 dark:bg-[#120A05]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-br from-white via-[#FAF5EE] to-[#F3E9DB] dark:from-[#1D1109] dark:via-[#160C06] dark:to-[#110904] border border-[#E5D6C3] dark:border-[#4D2E1A]/80 p-6 sm:p-8 shadow-sm dark:shadow-[0_18px_50px_-24px_rgba(245,158,11,0.22)] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Texto e botão */}
            <div className="lg:col-span-4">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-[#9A4D0D]/12 text-[#9A4D0D] dark:bg-[#F59E0B]/15 dark:text-[#F59E0B] grid place-items-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#1A100A] dark:text-white tracking-tight">
                    Cobertura na Matola
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6B5747] dark:text-[#B9A490] mt-1.5 leading-relaxed">
                    Estamos na Matola e arredores, prontos para atender sempre
                    que precisar.
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <Link
                  href="/app/pedido/novo"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#A45312] to-[#7C3B0B] hover:from-[#B45C15] hover:to-[#8B430E] dark:from-[#F59E0B] dark:to-[#B45309] dark:hover:from-[#FBBF24] dark:hover:to-[#D97706] text-white dark:text-[#140B05] font-bold text-xs transition whitespace-nowrap shadow-sm"
                >
                  <span>Ver no mapa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Mapa estilizado de malha viária da Matola */}
            <div className="lg:col-span-4">
              <div className="relative h-40 sm:h-44 rounded-2xl overflow-hidden bg-[#EFE5D7] dark:bg-[#100804] border border-[#DFCEB9] dark:border-[#4A2B17]/80">
                <svg
                  aria-hidden
                  viewBox="0 0 400 180"
                  className="w-full h-full object-cover"
                  preserveAspectRatio="xMidYMid slice"
                >
                  {/* Vias secundárias */}
                  <g
                    fill="none"
                    className="stroke-[#D7C3AB] dark:stroke-[#472A16]"
                    strokeWidth="1.2"
                  >
                    <path d="M0 35 L400 20" />
                    <path d="M0 75 L400 65" />
                    <path d="M0 120 L400 110" />
                    <path d="M0 155 L400 148" />
                    <path d="M40 0 L65 180" />
                    <path d="M115 0 L135 180" />
                    <path d="M190 0 L215 180" />
                    <path d="M275 0 L260 180" />
                    <path d="M345 0 L330 180" />
                  </g>
                  {/* Artérias principais iluminadas */}
                  <g
                    fill="none"
                    className="stroke-[#B45309]/80 dark:stroke-[#F59E0B]/80"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  >
                    <path d="M-10 138 Q 95 102 200 92 T 410 52" />
                    <path d="M55 -10 Q 130 70 200 92 T 310 190" />
                    <path d="M145 190 Q 175 120 200 92 T 245 -10" />
                  </g>
                </svg>

                {/* Marcador central Matola */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-[#1E1109]/95 border border-[#D4BEA5] dark:border-[#F59E0B]/40 shadow-md">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#A45312] to-[#7C3B0B] dark:from-[#F59E0B] dark:to-[#D97706] text-white dark:text-[#140B05] grid place-items-center">
                      <MapPin className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-extrabold text-[#1A100A] dark:text-white">
                      Matola
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Cartões de Métricas */}
            <div className="lg:col-span-4 grid grid-cols-3 gap-2.5">
              {METRICAS_COBERTURA.map((m) => {
                const Icone = m.icone;
                return (
                  <div
                    key={m.rotulo}
                    className="rounded-2xl bg-white/90 dark:bg-[#22140B] border border-[#E5D6C3] dark:border-[#492C19]/80 px-2.5 py-4 text-center flex flex-col items-center justify-center"
                  >
                    <span className="w-8 h-8 rounded-lg bg-[#F5EDE2] text-[#9A4D0D] dark:bg-[#311D10] dark:text-[#F59E0B] grid place-items-center mb-2">
                      <Icone className="w-4 h-4" />
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-[#1A100A] dark:text-white tabular-nums leading-tight">
                      {m.valor}
                    </span>
                    <span className="text-[11px] text-[#6B5747] dark:text-[#B9A490] mt-1 leading-tight">
                      {m.rotulo}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
