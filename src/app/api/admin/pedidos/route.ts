import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, tratarErroApi } from "@/lib/api";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await exigirPapel("ADMIN");

    const estado = req.nextUrl.searchParams.get("estado");
    const empresaId = req.nextUrl.searchParams.get("empresaId");
    const de = req.nextUrl.searchParams.get("de");
    const ate = req.nextUrl.searchParams.get("ate");

    const pedidos = await prisma.pedido.findMany({
      where: {
        estado: estado || undefined,
        empresaId: empresaId || undefined,
        criadoEm: {
          gte: de ? new Date(de) : undefined,
          lte: ate ? new Date(`${ate}T23:59:59`) : undefined,
        },
      },
      orderBy: { criadoEm: "desc" },
      include: {
        condutor: { select: { nome: true, telefone: true } },
        empresa: { select: { nome: true } },
        camiao: { select: { matricula: true } },
        avaliacao: { select: { estrelas: true } },
      },
      take: 200,
    });

    const empresas = await prisma.empresa.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });

    return ok({ pedidos, empresas });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
