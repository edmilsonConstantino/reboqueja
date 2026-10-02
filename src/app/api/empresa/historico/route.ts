import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, tratarErroApi } from "@/lib/api";

export async function GET() {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const empresa = await prisma.empresa.findUnique({
      where: { utilizadorId: sessao.id },
    });
    if (!empresa) return ok({ pedidos: [] });

    const pedidos = await prisma.pedido.findMany({
      where: {
        empresaId: empresa.id,
        estado: { in: ["CONCLUIDO", "CANCELADO"] },
      },
      orderBy: { actualizadoEm: "desc" },
      include: {
        condutor: { select: { nome: true } },
        camiao: { select: { matricula: true } },
        avaliacao: true,
      },
    });
    return ok({ pedidos });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
