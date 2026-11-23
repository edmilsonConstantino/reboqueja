import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { contextoCondutor, ESTADOS_EM_CURSO } from "@/lib/condutor";
import { coordenadasValidas } from "@/lib/geo";
import { schemaLocalizacaoCondutor } from "@/lib/validations";
import type { NextRequest } from "next/server";

/** POST: actualização periódica da localização GPS do condutor enquanto disponível ou em serviço. */
export async function POST(req: NextRequest) {
  try {
    const sessao = await exigirPapel("CONDUTOR");
    const { camiao } = await contextoCondutor(sessao.id);
    if (!camiao) {
      return erro("A sua conta ainda não tem um camião atribuído.", 403);
    }

    const dados = schemaLocalizacaoCondutor.parse(await req.json());
    if (!coordenadasValidas(dados)) {
      return erro("Coordenadas de localização inválidas.", 422);
    }

    const emCurso = await prisma.pedido.findFirst({
      where: { camiaoId: camiao.id, estado: { in: [...ESTADOS_EM_CURSO] } },
      select: { id: true },
    });

    if (!camiao.disponivel && !emCurso) {
      return erro(
        "A partilha de localização só está activa enquanto estiver disponível ou em serviço.",
        409
      );
    }

    const agora = new Date();
    await prisma.camiao.update({
      where: { id: camiao.id },
      data: {
        lat: dados.lat,
        lng: dados.lng,
        partilhaLocalizacao: true,
        localizacaoActualizadaEm: agora,
      },
    });

    return ok({
      sucesso: true,
      lat: dados.lat,
      lng: dados.lng,
      localizacaoActualizadaEm: agora,
    });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
