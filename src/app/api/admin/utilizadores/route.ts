import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { schemaUtilizadorActivo } from "@/lib/validations";
import type { NextRequest } from "next/server";

export async function GET() {
  try {
    await exigirPapel("ADMIN");
    const utilizadores = await prisma.utilizador.findMany({
      select: {
        id: true,
        nome: true,
        telefone: true,
        email: true,
        papel: true,
        activo: true,
        criadoEm: true,
        _count: { select: { pedidos: true } },
      },
      orderBy: { criadoEm: "desc" },
    });
    return ok({ utilizadores });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessao = await exigirPapel("ADMIN");
    const { id, ...resto } = (await req.json()) as { id: string } & Record<string, unknown>;
    const { activo } = schemaUtilizadorActivo.parse(resto);

    if (id === sessao.id) {
      return erro("Não pode desactivar a sua própria conta.", 409);
    }

    await prisma.utilizador.update({ where: { id }, data: { activo } });
    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
