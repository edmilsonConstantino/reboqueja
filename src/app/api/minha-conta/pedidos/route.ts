import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, tratarErroApi } from "@/lib/api";

export async function GET() {
  try {
    const sessao = await exigirPapel("CONDUTOR");
    const pedidos = await prisma.pedido.findMany({
      where: { condutorId: sessao.id },
      orderBy: { criadoEm: "desc" },
      include: { empresa: { select: { nome: true } } },
    });
    return ok({ pedidos });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
