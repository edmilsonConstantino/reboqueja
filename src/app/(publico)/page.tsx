"use client";

import Link from "next/link";
import { useState } from "react";

type TipoVeiculoPreco = "LIGEIRO" | "SUV" | "MINIBUS" | "PESADO";

const VEICULOS_INFO: Record<
  TipoVeiculoPreco,
  { icone: string; rotulo: string; faixaExemplo: string; texto: string }
> = {
  LIGEIRO: {
    icone: "🚗",
    rotulo: "Ligeiro",
    faixaExemplo: "500 MT – 1 000 MT",
    texto: "Sem surpresas: 500 MT – 1 000 MT para um ligeiro até 5 km.",
  },
  SUV: {
    icone: "🚙",
    rotulo: "SUV/Pick-up",
    faixaExemplo: "700 MT – 1 200 MT",
    texto: "Sem surpresas: 700 MT – 1 200 MT para um SUV/Pick-up até 5 km.",
  },
  MINIBUS: {
    icone: "🚐",
    rotulo: "Mini-bus",
    faixaExemplo: "1 000 MT – 1 800 MT",
    texto: "Sem surpresas: 1 000 MT – 1 800 MT para um mini-bus até 5 km.",
  },
  PESADO: {
    icone: "🚛",
    rotulo: "Pesado",
    faixaExemplo: "1 500 MT – 2 500 MT",
    texto: "Sem surpresas: 1 500 MT – 2 500 MT para um pesado até 5 km.",
  },
};

export default function Landing() {
  const [veiculoAtivo, setVeiculoAtivo] = useState<TipoVeiculoPreco>("LIGEIRO");

  return (
    <div className="min-h-screen bg-[#060911] text-neutral-100 antialiased selection:bg-[#FFC300] selection:text-neutral-950">
      {/* ===== HERO COM IMAGEM DE REBOQUE AO PÔR DO SOL ===== */}
      <section className="relative overflow-hidden bg-[#060911] border-b border-white/[0.06]">
        {/* Imagem de fundo */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-no-repeat pointer-events-none"
          style={{
            backgroundImage: "url('/hero-reboque.png')",
            backgroundPosition: "88% center",
          }}
        />
        {/* Degradês para leitura limpa do texto à esquerda */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[#060911] via-[#060911]/95 sm:via-[#060911]/85 to-transparent pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#060911] to-transparent pointer-events-none"
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-12 sm:pb-20">
          {/* Pílula de destaque */}
          <span className="inline-block bg-[#FFC300] text-neutral-950 text-[11px] font-black tracking-wider uppercase px-3.5 py-1 rounded-full mb-4 shadow-[0_0_12px_rgba(255,195,0,0.35)]">
            SERVIÇO DE REBOQUE NA MATOLA
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
            O veículo avariu?
            <br />
            <span className="text-[#FFC300]">O reboque chega já.</span>
          </h1>

          <p className="mt-4 text-xs sm:text-sm md:text-base text-neutral-300 max-w-lg leading-relaxed">
            O Reboque Já liga-o às empresas de reboque da Cidade da Matola em
            minutos. Veja a faixa de preço antes de pedir, acompanhe o camião no
            mapa e pague como preferir.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/registar"
              className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#FFC300] text-neutral-950 font-bold text-xs sm:text-sm hover:bg-[#ffd033] inline-flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-md shadow-[#FFC300]/25"
            >
              <span aria-hidden>🛻</span> Pedir reboque{" "}
              <span aria-hidden className="font-normal">
                →
              </span>
            </Link>
            <Link
              href="/registar/empresa"
              className="min-h-[44px] px-6 py-2.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-white font-bold text-xs sm:text-sm hover:bg-white/10 inline-flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <IconePredio className="w-3.5 h-3.5 text-neutral-200" /> Sou empresa de reboque
            </Link>
          </div>

          <p className="mt-4 text-xs text-neutral-300">
            Já tem conta?{" "}
            <Link
              href="/entrar"
              className="text-[#FFC300] font-semibold underline underline-offset-4 hover:text-[#ffd033] transition"
            >
              Entre aqui
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ===== COMO FUNCIONA (3 CARTÕES) ===== */}
      <section className="py-10 sm:py-14 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-10">
          {/* Traço indicador em amarelo dourado */}
          <div className="w-10 h-1 bg-[#FFC300] rounded-full mx-auto mb-2.5 shadow-[0_0_8px_rgba(255,195,0,0.5)]" />
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white">
            Como funciona
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1.5">
            É simples, rápido e seguro. Veja como pedir o seu reboque:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* Passo 1 */}
          <div className="rounded-2xl bg-[#090e1a]/95 border border-white/10 p-5 flex flex-col justify-start transition hover:border-white/20">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-[#FFC300] text-neutral-950 font-black text-xs grid place-items-center shrink-0">
                1
              </span>
              <IconePin className="w-5 h-5 text-[#FFC300]" />
            </div>
            <h3 className="font-bold text-base text-white mt-4">Marque o local</h3>
            <p className="text-xs sm:text-[13px] text-neutral-400 mt-1.5 leading-relaxed">
              A app usa o GPS para encontrar o veículo. Confirme o ponto da avaria
              no mapa e escolha o destino.
            </p>
          </div>

          {/* Passo 2 */}
          <div className="rounded-2xl bg-[#090e1a]/95 border border-white/10 p-5 flex flex-col justify-start transition hover:border-white/20">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-[#FFC300] text-neutral-950 font-black text-xs grid place-items-center shrink-0">
                2
              </span>
              <IconeLupa className="w-5 h-5 text-[#FFC300]" />
            </div>
            <h3 className="font-bold text-base text-white mt-4">Compare e escolha</h3>
            <p className="text-xs sm:text-[13px] text-neutral-400 mt-1.5 leading-relaxed">
              Vê as empresas disponíveis, com a faixa de preço em MT e o tempo
              estimado de chegada. Escolhe a melhor para si.
            </p>
          </div>

          {/* Passo 3 */}
          <div className="rounded-2xl bg-[#090e1a]/95 border border-white/10 p-5 flex flex-col justify-start transition hover:border-white/20">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-[#FFC300] text-neutral-950 font-black text-xs grid place-items-center shrink-0">
                3
              </span>
              <IconeCarro className="w-5 h-5 text-[#FFC300]" />
            </div>
            <h3 className="font-bold text-base text-white mt-4">Acompanhe e avalie</h3>
            <p className="text-xs sm:text-[13px] text-neutral-400 mt-1.5 leading-relaxed">
              Siga o camião em tempo real no mapa. No fim, indica o método de
              pagamento e avalia o serviço.
            </p>
          </div>
        </div>

        {/* ===== PREÇOS TRANSPARENTES, EM FAIXAS ===== */}
        <div className="mt-6 rounded-3xl bg-[#090e1a]/95 border border-white/10 p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Lado Esquerdo: Texto & Filtros */}
          <div className="lg:col-span-7">
            <div className="flex items-start gap-3.5">
              <span
                aria-hidden
                className="w-10 h-10 shrink-0 rounded-full border-2 border-[#FFC300] text-[#FFC300] font-black text-xs sm:text-sm grid place-items-center"
              >
                MT
              </span>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  Preços transparentes, em faixas
                </h3>
                <p className="text-xs sm:text-[13px] text-neutral-400 mt-1 leading-relaxed">
                  Cada empresa define as suas faixas por tipo de veículo e distância.
                  <br className="hidden sm:inline" />{" "}
                  {VEICULOS_INFO[veiculoAtivo].texto}
                </p>
              </div>
            </div>

            {/* Pílulas de tipos de veículo */}
            <div className="flex flex-wrap gap-2 mt-5">
              {(["LIGEIRO", "SUV", "MINIBUS", "PESADO"] as const).map((tipo) => {
                const ativo = veiculoAtivo === tipo;
                const info = VEICULOS_INFO[tipo];
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setVeiculoAtivo(tipo)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      ativo
                        ? "border border-[#FFC300] bg-[#FFC300]/15 text-white shadow-[0_0_10px_rgba(255,195,0,0.2)]"
                        : "border border-white/10 bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    <span>{info.icone}</span>
                    <span>{info.rotulo}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lado Direito: Ilustração do Mapa com Rota & ETA */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-[#060a14] border border-white/10 overflow-hidden p-5 min-h-[160px] flex items-center justify-between">
              {/* Badge de ETA no canto superior direito */}
              <div className="absolute top-3 right-3 z-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 flex items-center gap-1.5 text-[11px] text-white">
                <IconeRelogio className="w-3 h-3 text-neutral-400" />
                <span className="font-bold text-white">5.2 km</span>
                <span className="text-neutral-400">~ 12 min</span>
              </div>

              {/* Malha de ruas em SVG ao fundo */}
              <svg
                aria-hidden
                className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern
                    id="grid-mapa-home"
                    width="28"
                    height="28"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 28 0 L 0 0 0 28"
                      fill="none"
                      stroke="#142138"
                      strokeWidth="0.8"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-mapa-home)" />
                {/* Vias principais */}
                <path
                  d="M-20 100 Q 120 80 240 120 T 500 70"
                  stroke="#1c2d4d"
                  strokeWidth="7"
                  fill="none"
                />
                <path
                  d="M130 -20 Q 150 80 110 200"
                  stroke="#1c2d4d"
                  strokeWidth="5"
                  fill="none"
                />
              </svg>

              {/* Rota traçada e marcadores */}
              <div className="relative z-10 w-full flex items-center justify-between pt-3">
                {/* Pin de Origem */}
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-[#FFC300] grid place-items-center shadow-md shadow-[#FFC300]/40">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-950" />
                  </div>
                </div>

                {/* Linha pontilhada curva da rota */}
                <div className="flex-1 mx-2.5 flex items-center justify-center">
                  <svg className="w-full h-10 overflow-visible" viewBox="0 0 200 40">
                    <path
                      d="M 10 20 Q 90 40, 190 20"
                      fill="none"
                      stroke="#FFC300"
                      strokeWidth="3"
                      strokeDasharray="5 7"
                      strokeLinecap="round"
                    />
                    {/* Ponto intermédio de conexão */}
                    <circle cx="100" cy="27" r="3.5" fill="#FFC300" />
                  </svg>
                </div>

                {/* Marcador de destino com camião */}
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-[#FFC300] grid place-items-center text-neutral-950 text-base font-bold shadow-md shadow-[#FFC300]/50 animate-pulse">
                    🛻
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ===== ÍCONES SVG PERSONALIZADOS ===== */

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

function IconeLupa(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconeCarro(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.5-1.2-.7-1.8-.7H7c-.8 0-1.5.4-1.9 1.1L3.3 11.2C2.5 11.5 2 12.2 2 13v3c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

function IconeRelogio(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconePredio(props: React.SVGProps<SVGSVGElement>) {
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
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M9 7h1.5M13.5 7H15M9 11h1.5M13.5 11H15M9 15h1.5M13.5 15H15" />
      <path d="M10.5 21v-3h3v3" />
    </svg>
  );
}
