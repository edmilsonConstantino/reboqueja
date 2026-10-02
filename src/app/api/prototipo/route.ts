import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/auth";
import { ok, tratarErroApi } from "@/lib/api";
import { schemaRespostaPrototipo } from "@/lib/validations";
import { calcularSus } from "@/lib/sus";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const sessao = await exigirSessao();
    const dados = schemaRespostaPrototipo.parse(await req.json());
    const susScore = calcularSus(dados.sus);

    const existente = await prisma.respostaPrototipo.findFirst({
      where: { utilizadorId: sessao.id },
    });

    const payload = {
      sus: dados.sus,
      extras: dados.extras,
      comentario: dados.comentario || null,
    };

    if (existente) {
      await prisma.respostaPrototipo.update({
        where: { id: existente.id },
        data: {
          respostas: JSON.stringify(payload),
          susScore,
          comentario: dados.comentario || null,
        },
      });
      return ok({ susScore, actualizado: true });
    }

    await prisma.respostaPrototipo.create({
      data: {
        utilizadorId: sessao.id,
        papel: sessao.papel,
        respostas: JSON.stringify(payload),
        susScore,
        comentario: dados.comentario || null,
      },
    });
    return ok({ susScore }, 201);
  } catch (e) {
    return tratarErroApi(e);
  }
}

export async function GET() {
  try {
    const sessao = await exigirSessao();
    const resposta = await prisma.respostaPrototipo.findFirst({
      where: { utilizadorId: sessao.id },
    });
    return ok({ resposta });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
