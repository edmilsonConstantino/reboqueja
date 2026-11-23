import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { schemaCamiao } from "@/lib/validations";
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
      include: {
        motorista: { select: { id: true, nome: true, telefone: true, activo: true } },
      },
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
    const matricula = dados.matricula.trim().toUpperCase();
    const duplicada = await prisma.camiao.findFirst({
      where: { matricula },
      select: { id: true },
    });
    if (duplicada) {
      return erro(`Já existe um camião com a matrícula ${matricula}.`, 409);
    }

    const camiao = await prisma.camiao.create({
      data: {
        empresaId: id,
        matricula,
        marca: dados.marca?.trim() || null,
        modelo: dados.modelo?.trim() || null,
        tipo: dados.tipo,
        capacidade: dados.capacidade?.trim() || null,
        motoristaNome: dados.motoristaNome || "",
        motoristaTelefone: dados.motoristaTelefone || "",
        activo: dados.activo ?? true,
        lat: 0,
        lng: 0,
        disponivel: false,
        partilhaLocalizacao: false,
        localizacaoActualizadaEm: null,
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
        matricula: parsed.matricula?.trim().toUpperCase(),
        marca: parsed.marca !== undefined ? parsed.marca?.trim() || null : undefined,
        modelo: parsed.modelo !== undefined ? parsed.modelo?.trim() || null : undefined,
        capacidade: parsed.capacidade !== undefined ? parsed.capacidade?.trim() || null : undefined,
        ...(parsed.activo === false ? { disponivel: false, partilhaLocalizacao: false } : {}),
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
