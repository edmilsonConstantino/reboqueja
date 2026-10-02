import { prisma } from "@/lib/prisma";
import { faixaPrecoTexto, formatarKm } from "@/lib/format";
import { Cartao, Etiqueta, Vazio } from "@/components/ui";
import { LABEL_VEICULO } from "@/lib/constants-client";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PaginaEmpresas() {
  const empresas = await prisma.empresa.findMany({
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold mb-2">Empresas de reboque</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">
        Empresas aprovadas a operar na Cidade da Matola. Os preços são faixas
        definidas por cada empresa, por tipo de veículo e distância.
      </p>

      {empresas.length === 0 ? (
        <Vazio
          titulo="Ainda não há empresas aprovadas"
          descricao="Volte mais tarde ou registe a sua empresa de reboque."
          accao={
            <Link href="/registar/empresa" className="text-primary-600 font-semibold underline">
              Registar empresa
            </Link>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {empresas.map((e) => {
            const avaliacoes = e.pedidos.map((p) => p.avaliacao!.estrelas);
            const media =
              avaliacoes.length > 0
                ? avaliacoes.reduce((a, b) => a + b, 0) / avaliacoes.length
                : null;

            const tipos = Array.from(new Set(e.precos.map((p) => p.tipoVeiculo)));

            return (
              <Cartao key={e.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-extrabold text-lg leading-tight">{e.nome}</h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {e.endereco}
                    </p>
                  </div>
                  <Etiqueta cor={e.disponivel ? "verde" : "cinza"}>
                    {e.disponivel ? "Disponível" : "Indisponível"}
                  </Etiqueta>
                </div>

                <div className="flex items-center gap-3 mt-3 text-sm">
                  <span className="text-primary-500 font-bold">
                    ★ {media ? media.toFixed(1) : "—"}
                  </span>
                  <span className="text-neutral-400">({avaliacoes.length})</span>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    🚚 {e.camioes.length} camiões
                  </span>
                </div>

                {/* Faixas por tipo de veículo */}
                <div className="mt-4 space-y-2">
                  {tipos.map((t) => {
                    const faixas = e.precos
                      .filter((p) => p.tipoVeiculo === t)
                      .sort((a, b) => a.kmMin - b.kmMin);
                    return (
                      <div key={t} className="text-xs">
                        <p className="font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                          {LABEL_VEICULO[t] || t}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {faixas.map((f) => (
                            <span
                              key={f.id}
                              className="bg-neutral-100 dark:bg-neutral-800 rounded-lg px-2 py-1"
                            >
                              {f.kmMax >= 9999
                                ? `20+ km`
                                : `${formatarKm(f.kmMin)}–${formatarKm(f.kmMax)}`}:{" "}
                              <b>{faixaPrecoTexto(f.precoMin, f.precoMax)}</b>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Cartao>
            );
          })}
        </div>
      )}
    </div>
  );
}
