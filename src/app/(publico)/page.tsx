import Link from "next/link";
import { faixaPrecoTexto } from "@/lib/format";

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-100 dark:from-neutral-900 to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 pt-14 pb-16 text-center">
          <span className="inline-block bg-primary-400 text-neutral-900 text-xs font-bold px-3 py-1 rounded-full mb-5">
            PROTOTIPO ACADEMICO · CIDADE DA MATOLA
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            O veículo avariu? <br />
            <span className="text-primary-500">O reboque chega já.</span>
          </h1>
          <p className="mt-5 text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
            O ReboqueJá liga-o às empresas de reboque da Cidade da Matola em
            minutos. Veja a faixa de preço antes de pedir, acompanhe o camião no
            mapa e pague como preferir.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/registar"
              className="min-h-[48px] px-7 py-3.5 rounded-xl bg-primary-400 text-neutral-900 font-bold hover:bg-primary-300 shadow-card"
            >
              🛻 Pedir reboque
            </Link>
            <Link
              href="/registar/empresa"
              className="min-h-[48px] px-7 py-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              🏢 Sou empresa de reboque
            </Link>
          </div>
          <p className="mt-4 text-xs text-neutral-500">
            Já tem conta?{" "}
            <Link href="/entrar" className="underline font-semibold">
              Entre aqui
            </Link>
          </p>
        </div>
      </section>

      {/* Como funciona */}
      <section className="max-w-5xl mx-auto px-4 pb-14">
        <h2 className="text-2xl font-extrabold text-center mb-8">
          Como funciona
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              n: "1",
              t: "Marque o local",
              d: "A app usa o GPS para encontrar o veículo. Confirme o ponto da avaria no mapa e escolha o destino.",
            },
            {
              n: "2",
              t: "Compare e escolha",
              d: "Vê as empresas disponíveis com a faixa de preço em MT e o tempo estimado de chegada. Escolhe a melhor para si.",
            },
            {
              n: "3",
              t: "Acompanhe e avalie",
              d: "Siga o camião em tempo real no mapa. No fim, indica o método de pagamento e avalia o serviço.",
            },
          ].map((p) => (
            <div
              key={p.n}
              className="bg-white dark:bg-neutral-900 rounded-2xl shadow-card border border-neutral-100 dark:border-neutral-800 p-6"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-400 text-neutral-900 font-extrabold grid place-items-center mb-4">
                {p.n}
              </div>
              <h3 className="font-bold text-lg mb-1">{p.t}</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {p.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Faixas de preço de exemplo */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="bg-neutral-900 dark:bg-neutral-800 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-extrabold mb-2">
            Preços transparentes, em faixas
          </h2>
          <p className="text-sm text-neutral-300 mb-6">
            Cada empresa define as suas faixas por tipo de veículo e distância.
            Sem surpresas: {faixaPrecoTexto(500, 1000)} para um ligeiro até 5 km.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-sm font-semibold">
            {["Ligeiro", "SUV/Pick-up", "Mini-bus", "Pesado"].map((t) => (
              <span
                key={t}
                className="bg-white/10 border border-white/20 rounded-full px-4 py-2"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
