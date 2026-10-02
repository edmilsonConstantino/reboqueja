import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { schemaAprovarEmpresa } from "@/lib/validations";
import type { NextRequest } from "next/server";

export async function GET() {
  try {
    await exigirPapel("ADMIN");
    const empresas = await prisma.empresa.findMany({
      include: {
        utilizador: { select: { nome: true, telefone: true, email: true } },
        _count: { select: { camioes: true, pedidos: true } },
      },
      orderBy: { estadoAprovacao: "asc" },
    });
    return ok({ empresas });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await exigirPapel("ADMIN");
    const { id, decisao } = (await req.json()) as {
      id: string;
      decisao: "APROVADA" | "REJEITADA";
    };
    schemaAprovarEmpresa.parse({ decisao });

    const empresa = await prisma.empresa.findUnique({ where: { id } });
    if (!empresa) return erro("Empresa não encontrada.", 404);
    if (!empresa.consentimentoEm && decisao === "APROVADA") {
      return erro(
        "A empresa ainda não deu consentimento para publicar os dados.",
        409
      );
    }

    await prisma.empresa.update({
      where: { id },
      data: { estadoAprovacao: decisao },
    });
    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
