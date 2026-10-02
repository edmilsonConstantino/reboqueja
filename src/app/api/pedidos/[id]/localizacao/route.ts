import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, tratarErroApi } from "@/lib/api";
import type { NextRequest } from "next/server";

/** Localização actual do camião (usado pelo acompanhamento em tempo real). */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await exigirPapel("CONDUTOR", "EMPRESA", "ADMIN");
    const pedido = await prisma.pedido.findUnique({
      where: { id: params.id },
      select: { camiao: { select: { id: true, lat: true, lng: true, matricula: true } } },
    });
    return ok({
      camiao: pedido?.camiao
        ? { lat: pedido.camiao.lat, lng: pedido.camiao.lng }
        : null,
    });
  } catch (e) {
    return tratarErroApi(e);
  }
}

/** A empresa actualiza a posição do camião (partilha GPS ou simulação). */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const empresa = await prisma.empresa.findUnique({
      where: { utilizadorId: sessao.id },
    });
    if (!empresa) return ok({ sucesso: false }, 404);

    const pedido = await prisma.pedido.findUnique({ where: { id: params.id } });
    if (!pedido || pedido.empresaId !== empresa.id || !pedido.camiaoId) {
      return ok({ sucesso: false }, 404);
    }

    const { lat, lng } = (await req.json()) as { lat: number; lng: number };
    await prisma.camiao.update({
      where: { id: pedido.camiaoId },
      data: { lat, lng },
    });
    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
