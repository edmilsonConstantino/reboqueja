import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { schemaCamiao } from "@/lib/validations";
import { CENTRO_MATOLA } from "@/lib/constants";
import type { NextRequest } from "next/server";

async function empresaId(sessaoId: string) {
  const empresa = await prisma.empresa.findUnique({
    where: { utilizadorId: sessaoId },
  });
  return empresa?.id ?? null;
}

export async function GET() {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const id = await empresaId(sessao.id);
    if (!id) return ok({ camioes: [] });
    const camioes = await prisma.camiao.findMany({
      where: { empresaId: id },
      orderBy: { matricula: "asc" },
    });
    return ok({ camioes });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const id = await empresaId(sessao.id);
    if (!id) return erro("Empresa não encontrada.", 404);

    const dados = schemaCamiao.parse(await req.json());
    const camiao = await prisma.camiao.create({
      data: {
        empresaId: id,
        matricula: dados.matricula.toUpperCase(),
        tipo: dados.tipo,
        capacidade: dados.capacidade || null,
        motoristaNome: dados.motoristaNome,
        motoristaTelefone: dados.motoristaTelefone,
        activo: dados.activo ?? true,
        lat: CENTRO_MATOLA.lat + (Math.random() - 0.5) * 0.04,
        lng: CENTRO_MATOLA.lng + (Math.random() - 0.5) * 0.04,
      },
    });
    return ok({ id: camiao.id }, 201);
  } catch (e) {
    return tratarErroApi(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const id = await empresaId(sessao.id);
    if (!id) return erro("Empresa não encontrada.", 404);

    const { id: camiaoId, ...dados } = (await req.json()) as {
      id: string;
    } & Record<string, unknown>;
    const parsed = schemaCamiao.partial().parse(dados);

    const camiao = await prisma.camiao.findUnique({ where: { id: camiaoId } });
    if (!camiao || camiao.empresaId !== id) return erro("Camião não encontrado.", 404);

    await prisma.camiao.update({
      where: { id: camiaoId },
      data: {
        ...parsed,
        matricula: parsed.matricula?.toUpperCase(),
        capacidade: parsed.capacidade ?? undefined,
      },
    });
    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const id = await empresaId(sessao.id);
    if (!id) return erro("Empresa não encontrada.", 404);

    const camiaoId = req.nextUrl.searchParams.get("id");
    if (!camiaoId) return erro("Indique o camião.", 422);

    const camiao = await prisma.camiao.findUnique({ where: { id: camiaoId } });
    if (!camiao || camiao.empresaId !== id) return erro("Camião não encontrado.", 404);

    await prisma.camiao.delete({ where: { id: camiaoId } });
    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
