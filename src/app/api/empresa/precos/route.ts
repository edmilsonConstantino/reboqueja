import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { schemaFaixaPreco } from "@/lib/validations";
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
    if (!id) return ok({ precos: [] });
    const precos = await prisma.faixaPreco.findMany({
      where: { empresaId: id },
      orderBy: [{ tipoVeiculo: "asc" }, { kmMin: "asc" }],
    });
    return ok({ precos });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const id = await empresaId(sessao.id);
    if (!id) return erro("Empresa não encontrada.", 404);

    const dados = schemaFaixaPreco.parse(await req.json());

    const existente = await prisma.faixaPreco.findFirst({
      where: { empresaId: id, tipoVeiculo: dados.tipoVeiculo, kmMin: dados.kmMin },
    });
    if (existente) {
      await prisma.faixaPreco.update({
        where: { id: existente.id },
        data: {
          kmMax: dados.kmMax,
          precoMin: dados.precoMin,
          precoMax: dados.precoMax,
        },
      });
      return ok({ id: existente.id, actualizado: true });
    }

    const faixa = await prisma.faixaPreco.create({
      data: { empresaId: id, ...dados },
    });
    return ok({ id: faixa.id }, 201);
  } catch (e) {
    return tratarErroApi(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const id = await empresaId(sessao.id);
    if (!id) return erro("Empresa não encontrada.", 404);

    const faixaId = req.nextUrl.searchParams.get("id");
    if (!faixaId) return erro("Indique a faixa.", 422);

    const faixa = await prisma.faixaPreco.findUnique({ where: { id: faixaId } });
    if (!faixa || faixa.empresaId !== id) return erro("Faixa não encontrada.", 404);

    await prisma.faixaPreco.delete({ where: { id: faixaId } });
    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
