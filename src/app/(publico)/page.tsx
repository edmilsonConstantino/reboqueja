import Link from "next/link";
import { faixaPrecoTexto } from "@/lib/format";

export default function Landing() {
  return (
    <div>
      {/* ===== HERO com imagem de fundo ===== */}
      <section className="relative overflow-hidden bg-neutral-950">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-no-repeat"
          style={{
            backgroundImage: "url('/hero-reboque.png')",
            backgroundPosition: "72% center",
          }}
        />
        {/* Escurecer à esquerda para o texto ficar legível */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/75 to-neutral-950/10"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-neutral-950 to-transparent"
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-32 pb-16 sm:pt-40 sm:pb-24">
          <span className="inline-block bg-primary-400 text-neutral-950 text-[11px] sm:text-xs font-extrabold tracking-wide px-3.5 py-1.5 rounded-full mb-6">
            PROTÓTIPO ACADÉMICO · CIDADE DA MATOLA
          </span>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05] text-white">
            O veículo avariu?
            <br />
            <span className="text-primary-400">O reboque chega já.</span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-neutral-300 max-w-xl">
            O Reboque Já liga-o às empresas de reboque da Cidade da Matola em
            minutos. Veja a faixa de preço antes de pedir, acompanhe o camião no
            mapa e pague como preferir.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/registar"
              className="min-h-[48px] px-7 py-3.5 rounded-xl bg-primary-400 text-neutral-950 font-bold hover:bg-primary-300 inline-flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <span aria-hidden>🛻</span> Pedir reboque{" "}
              <span aria-hidden className="font-normal">
                →
              </span>
            </Link>
            <Link
              href="/registar/empresa"
              className="min-h-[48px] px-7 py-3.5 rounded-xl border border-white/40 bg-white/5 backdrop-blur-sm text-white font-bold hover:bg-white/10 inline-flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <span aria-hidden>🏢</span> Sou empresa de reboque
            </Link>
          </div>

          <p className="mt-5 text-sm text-neutral-300">
            Já tem conta?{" "}
            <Link
              href="/entrar"
              className="text-primary-400 font-semibold underline underline-offset-4 hover:text-primary-300"
            >
              Entre aqui
            </Link>
          </p>
        </div>
      </section>

      {/* ===== COMO FUNCIONA (faixa escura) ===== */}
      <section className="bg-neutral-950 text-neutral-100 py-14 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div
              aria-hidden
              className="w-14 h-1 bg-primary-400 rounded-full mx-auto mb-4"
            />
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Como funciona
            </h2>
            <p className="text-sm text-neutral-400 mt-2">
              É simples, rápido e seguro. Veja como pedir o seu reboque:
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                n: "1",
                t: "Marque o local",
                d: "A app usa o GPS para encontrar o veículo. Confirme o ponto da avaria no mapa e escolha o destino.",
                icone: <IconeLocal className="w-7 h-7 text-primary-400" />,
                marca: <IconeLocal className="w-24 h-24 text-neutral-800/80" />,
              },
              {
                n: "2",
                t: "Compare e escolha",
                d: "Vê as empresas disponíveis, com a faixa de preço em MT e o tempo estimado de chegada. Escolhe a melhor para si.",
                icone: <IconeLupa className="w-7 h-7 text-primary-400" />,
                marca: <IconeEscudo className="w-24 h-24 text-neutral-800/80" />,
              },
              {
                n: "3",
                t: "Acompanhe e avalie",
                d: "Siga o camião em tempo real no mapa. No fim, indica o método de pagamento e avalia o serviço.",
                icone: <IconeCarro className="w-7 h-7 text-primary-400" />,
                marca: <IconeRota className="w-24 h-24 text-neutral-800/80" />,
              },
            ].map((p) => (
              <div
                key={p.n}
                className="relative overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 border-b-2 border-b-primary-400 p-6"
              >
                <div aria-hidden className="absolute -top-3 right-2 opacity-60 pointer-events-none">
                  {p.marca}
                </div>
                <div className="relative flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-primary-400 text-neutral-950 font-extrabold grid place-items-center">
                    {p.n}
                  </span>
                  {p.icone}
                </div>
                <h3 className="relative font-bold text-lg mt-4">{p.t}</h3>
                <p className="relative text-sm text-neutral-400 mt-1.5 leading-relaxed">
                  {p.d}
                </p>
              </div>
            ))}
          </div>

          {/* ===== PREÇOS TRANSPARENTES ===== */}
          <div className="mt-6 relative overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 border-b-2 border-b-primary-400 p-6 sm:p-8 grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-start gap-4">
                <span
                  aria-hidden
                  className="w-12 h-12 shrink-0 rounded-full border-2 border-primary-400 grid place-items-center font-extrabold text-primary-400 text-sm"
                >
                  MT
                </span>
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                    Preços transparentes, em faixas
                  </h3>
                  <p className="text-sm text-neutral-400 mt-2 max-w-md leading-relaxed">
                    Cada empresa define as suas faixas por tipo de veículo e
                    distância. Sem surpresas: {faixaPrecoTexto(500, 1000)} para
                    um ligeiro até 5 km.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-5">
                {[
                  { i: "🚗", t: "Ligeiro" },
                  { i: "🚙", t: "SUV/Pick-up" },
                  { i: "🚐", t: "Mini-bus" },
                  { i: "🚛", t: "Pesado" },
                ].map((v) => (
                  <span
                    key={v.t}
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800/60 px-4 py-2 text-sm font-semibold text-neutral-200"
                  >
                    <span aria-hidden>{v.i}</span> {v.t}
                  </span>
                ))}
              </div>
            </div>

            <div className="max-w-md w-full justify-self-center lg:justify-self-end">
              <IlustracaoMapa />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ===== Ícones (traço, cor herda de currentColor) ===== */

function IconeLocal(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
      <path d="M4 11h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1" />
      <path d="M3 12v4a1 1 0 0 0 1 1h1" />
      <path d="M5 17v2M19 17v2" />
      <circle cx="8" cy="15.5" r="0.5" />
      <circle cx="16" cy="15.5" r="0.5" />
    </svg>
  );
}

function IconeEscudo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconeRota(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" strokeDasharray="3 3" />
    </svg>
  );
}

/* ===== Ilustração do mapa (rota com pin e camião) ===== */

function IlustracaoMapa() {
  return (
    <svg
      viewBox="0 0 440 240"
      className="w-full h-auto"
      role="img"
      aria-label="Ilustração de uma rota no mapa, do local da avaria até ao camião"
    >
      <rect x="1" y="1" width="438" height="238" rx="15" fill="#0b0e14" />
      <defs>
        <pattern id="rj-grade" width="44" height="44" patternUnits="userSpaceOnUse">
          <path d="M44 0H0v44" fill="none" stroke="#161c26" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="1" y="1" width="438" height="238" rx="15" fill="url(#rj-grade)" />

      {/* Avenidas */}
      <path
        d="M0 175 C 120 150, 240 200, 440 145"
        stroke="#1d2532"
        strokeWidth="14"
        fill="none"
      />
      <path
        d="M150 0 C 165 80, 110 160, 160 240"
        stroke="#1d2532"
        strokeWidth="10"
        fill="none"
      />

      {/* Rota tracejada */}
      <path
        d="M92 74 C 160 95, 190 130, 280 148 S 356 160, 368 182"
        stroke="#FFC300"
        strokeWidth="3"
        strokeDasharray="8 9"
        fill="none"
        strokeLinecap="round"
      />

      {/* Pin de origem */}
      <g transform="translate(92,74)">
        <path
          d="M0 -26 C -12 -26 -19 -17 -19 -9 C -19 2 0 20 0 20 C 0 20 19 2 19 -9 C 19 -17 12 -26 0 -26 Z"
          fill="#FFC300"
        />
        <circle cx="0" cy="-10" r="6.5" fill="#0b0e14" />
      </g>

      {/* Ponto intermédio */}
      <circle cx="230" cy="128" r="5" fill="#FFC300" />

      {/* Camião no destino */}
      <circle cx="368" cy="188" r="27" fill="#FFC300" />
      <text
        x="368"
        y="189"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="24"
      >
        🛻
      </text>
    </svg>
  );
}
