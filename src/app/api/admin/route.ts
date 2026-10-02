import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, tratarErroApi } from "@/lib/api";

export async function GET() {
  try {
    await exigirPapel("ADMIN");

    const [
      porEstado,
      empresas,
      totalUtilizadores,
      mediaAvaliacoes,
    ] = await Promise.all([
      prisma.pedido.groupBy({
        by: ["estado"],
        _count: true,
      }),
      prisma.empresa.findMany({
        select: { estadoAprovacao: true, _count: { select: { pedidos: true } } },
      }),
      prisma.utilizador.count(),
      prisma.avaliacao.aggregate({ _avg: { estrelas: true }, _count: true }),
    ]);

    // Tempos médios calculados em JS (o SQLite guarda datas como inteiros ms)
    const eventos = await prisma.pedidoEvento.findMany({
      select: { pedidoId: true, estado: true, criadoEm: true },
      orderBy: { criadoEm: "asc" },
    });
    const primeiro = (pedidoId: string, estado: string) =>
      eventos.find((e) => e.pedidoId === pedidoId && e.estado === estado);
    const pedidosIds = Array.from(new Set(eventos.map((e) => e.pedidoId)));
    let somaResposta = 0, nResposta = 0, somaChegada = 0, nChegada = 0;
    for (const id of pedidosIds) {
      const pen = primeiro(id, "PENDENTE");
      const ace = primeiro(id, "ACEITE");
      const nol = primeiro(id, "NO_LOCAL");
      if (pen && ace) {
        somaResposta += (ace.criadoEm.getTime() - pen.criadoEm.getTime()) / 60000;
        nResposta++;
      }
      if (ace && nol) {
        somaChegada += (nol.criadoEm.getTime() - ace.criadoEm.getTime()) / 60000;
        nChegada++;
      }
    }

    // Bairros: extraído do endereço de origem (heurística simples sobre o texto)
    const pedidos = await prisma.pedido.findMany({
      select: { origemEndereco: true },
    });
    const contarBairros: Record<string, number> = {};
    const BAIRROS = [
      "Machava", "Matola Rio", "Liberdade", "T3", "Fomento", "Matola Gare",
      "Infulene", "Sungo", "Marrote", "Muanono", "1.º de Maio",
      "Matola A", "Matola B", "Matola C", "Zimpeto",
    ];
    for (const p of pedidos) {
      const end = p.origemEndereco.toLowerCase();
      const bairro = BAIRROS.find((b) => end.includes(b.toLowerCase()));
      if (bairro) {
        contarBairros[bairro] = (contarBairros[bairro] || 0) + 1;
      } else {
        contarBairros["Outros"] = (contarBairros["Outros"] || 0) + 1;
      }
    }

    const emp = (estado: string) =>
      empresas.filter((e) => e.estadoAprovacao === estado).length;

    return ok({
      pedidosPorEstado: porEstado,
      empresas: {
        aprovadas: emp("APROVADA"),
        pendentes: emp("PENDENTE"),
        rejeitadas: emp("REJEITADA"),
      },
      totalUtilizadores,
      mediaAvaliacoes: mediaAvaliacoes._avg.estrelas,
      totalAvaliacoes: mediaAvaliacoes._count,
      tempoMedioRespostaMin: nResposta > 0 ? somaResposta / nResposta : null,
      tempoMedioChegadaMin: nChegada > 0 ? somaChegada / nChegada : null,
      pedidosPorBairro: Object.entries(contarBairros)
        .map(([bairro, total]) => ({ bairro, total }))
        .sort((a, b) => b.total - a.total),
    });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
