import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { schemaAprovarEmpresa } from "@/lib/validations";
import { ESTADOS_EM_CURSO, localizacaoActualizada } from "@/lib/condutor";
import type { NextRequest } from "next/server";

export async function GET() {
  try {
    await exigirPapel("ADMIN");
    const empresas = await prisma.empresa.findMany({
      include: {
        utilizador: {
          select: { nome: true, telefone: true, email: true, criadoEm: true },
        },
        _count: { select: { camioes: true, pedidos: true } },
        camioes: {
          select: {
            id: true,
            matricula: true,
            tipo: true,
            activo: true,
            disponivel: true,
            partilhaLocalizacao: true,
            localizacaoActualizadaEm: true,
            lat: true,
            lng: true,
            pedidos: {
              where: { estado: { in: [...ESTADOS_EM_CURSO] } },
              select: { id: true, estado: true },
              take: 1,
            },
            motorista: {
              select: {
                id: true,
                nome: true,
                telefone: true,
                email: true,
                activo: true,
              },
            },
          },
          orderBy: { matricula: "asc" },
        },
      },
      orderBy: { estadoAprovacao: "asc" },
    });

    const enriquecidas = empresas.map((e) => ({
      ...e,
      camioes: e.camioes.map((c) => ({
        id: c.id,
        matricula: c.matricula,
        tipo: c.tipo,
        activo: c.activo,
        disponivel: Boolean(c.disponivel),
        localizacaoValida: localizacaoActualizada(c),
        emServico: c.pedidos.length > 0,
        motorista: c.motorista,
      })),
    }));

    return ok({ empresas: enriquecidas });
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
