import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { z } from "zod";
import type { NextRequest } from "next/server";

export async function GET() {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const empresa = await prisma.empresa.findUnique({
      where: { utilizadorId: sessao.id },
      include: { camioes: true },
    });
    if (!empresa) return erro("Empresa não encontrada.", 404);
    return ok({ empresa });
  } catch (e) {
    return tratarErroApi(e);
  }
}

const schemaPerfilEmpresa = z.object({
  telefone: z.string().min(9).optional(),
  email: z.string().email().optional(),
  endereco: z.string().min(5).optional(),
  raioKm: z.number().min(1).max(50).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const dados = schemaPerfilEmpresa.parse(await req.json());
    await prisma.empresa.update({
      where: { utilizadorId: sessao.id },
      data: dados,
    });
    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
