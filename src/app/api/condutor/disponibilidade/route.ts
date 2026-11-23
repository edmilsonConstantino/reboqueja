import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { contextoCondutor, ESTADOS_EM_CURSO } from "@/lib/condutor";
import { coordenadasValidas } from "@/lib/geo";
import { schemaDisponibilidadeCondutor } from "@/lib/validations";
import type { NextRequest } from "next/server";

/** PATCH: o condutor alterna o seu estado entre "Disponível para serviços" e "Indisponível". */
export async function PATCH(req: NextRequest) {
  try {
    const sessao = await exigirPapel("CONDUTOR");
    const { utilizador, camiao, empresa, podeOperar } = await contextoCondutor(sessao.id);

    if (!utilizador || !camiao || !empresa) {
      return erro("A sua conta ainda não tem um camião atribuído. Contacte a empresa.", 403);
    }

    const dados = schemaDisponibilidadeCondutor.parse(await req.json());

    if (dados.disponivel) {
      if (!podeOperar) {
        return erro(
          empresa.estadoAprovacao !== "APROVADA"
            ? "A sua empresa ainda não foi aprovada pelo administrador."
            : !camiao.activo
              ? "O seu camião está inactivo. Contacte a empresa."
              : "A sua conta não tem permissão para receber serviços.",
          403
        );
      }

      const emCurso = await prisma.pedido.findFirst({
        where: { camiaoId: camiao.id, estado: { in: [...ESTADOS_EM_CURSO] } },
      });
      if (emCurso) {
        return erro(
          "Tem um serviço em execução. Conclua o serviço actual antes de ficar disponível para novos pedidos.",
          409
        );
      }

      if (!coordenadasValidas({ lat: dados.lat, lng: dados.lng })) {
        return erro(
          "Não foi possível obter a tua localização. Activa a localização do dispositivo e concede autorização à aplicação.",
          422
        );
      }

      const agora = new Date();
      const actualizado = await prisma.camiao.update({
        where: { id: camiao.id },
        data: {
          disponivel: true,
          partilhaLocalizacao: true,
          lat: dados.lat!,
          lng: dados.lng!,
          localizacaoActualizadaEm: agora,
        },
        select: {
          id: true,
          disponivel: true,
          partilhaLocalizacao: true,
          lat: true,
          lng: true,
          localizacaoActualizadaEm: true,
        },
      });

      return ok({ camiao: actualizado });
    }

    // Ficar indisponível: interrompe partilha para pesquisa, salvo se tiver serviço em execução
    const emCurso = await prisma.pedido.findFirst({
      where: { camiaoId: camiao.id, estado: { in: [...ESTADOS_EM_CURSO] } },
    });

    const actualizado = await prisma.camiao.update({
      where: { id: camiao.id },
      data: {
        disponivel: false,
        ...(emCurso ? {} : { partilhaLocalizacao: false }),
      },
      select: {
        id: true,
        disponivel: true,
        partilhaLocalizacao: true,
        lat: true,
        lng: true,
        localizacaoActualizadaEm: true,
      },
    });

    return ok({ camiao: actualizado });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
