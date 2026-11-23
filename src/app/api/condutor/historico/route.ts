import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, tratarErroApi } from "@/lib/api";
import { contextoCondutor } from "@/lib/condutor";

export async function GET() {
  try {
    const sessao = await exigirPapel("CONDUTOR");
    const { camiao } = await contextoCondutor(sessao.id);
    if (!camiao) return ok({ pedidos: [], media: null, total: 0, receitaMin: 0, receitaMax: 0 });

    const pedidos = await prisma.pedido.findMany({
      where: {
        camiaoId: camiao.id,
        estado: { in: ["CONCLUIDO", "CANCELADO"] },
      },
      orderBy: { actualizadoEm: "desc" },
      include: {
        condutor: { select: { nome: true } },
        empresa: { select: { nome: true } },
        avaliacao: { select: { estrelas: true, comentario: true } },
      },
    });

    const avaliacoes = pedidos
      .map((p) => p.avaliacao)
      .filter((a): a is { estrelas: number; comentario: string | null } => Boolean(a));

    const concluidos = pedidos.filter((p) => p.estado === "CONCLUIDO");

    return ok({
      pedidos: pedidos.map((p) => ({
        id: p.id,
        estado: p.estado,
        criadoEm: p.criadoEm,
        actualizadoEm: p.actualizadoEm,
        origemEndereco: p.origemEndereco,
        destinoEndereco: p.destinoEndereco,
        distanciaKm: p.distanciaKm,
        tipoProblema: p.tipoProblema,
        tipoVeiculo: p.tipoVeiculo,
        precoMin: p.precoMin,
        precoMax: p.precoMax,
        clienteNome: p.condutor.nome,
        empresaNome: p.empresa?.nome ?? null,
        avaliacao: p.avaliacao,
      })),
      media:
        avaliacoes.length > 0
          ? avaliacoes.reduce((s, a) => s + a.estrelas, 0) / avaliacoes.length
          : null,
      total: concluidos.length,
      receitaMin: concluidos.reduce((s, p) => s + p.precoMin, 0),
      receitaMax: concluidos.reduce((s, p) => s + p.precoMax, 0),
    });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
