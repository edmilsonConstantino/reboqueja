import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { contextoCondutor, ESTADOS_EM_CURSO } from "@/lib/condutor";
import { EXPIRACAO_PEDIDO_MS } from "@/lib/constants";
import { schemaAceitarPedidoCondutor } from "@/lib/validations";
import type { NextRequest } from "next/server";

/** O condutor aceita uma solicitação dirigida ao seu veículo (PENDENTE → ACEITE). */
export async function POST(req: NextRequest) {
  try {
    const sessao = await exigirPapel("CONDUTOR");
    const { utilizador, camiao, empresa, podeOperar, podeReceber } = await contextoCondutor(sessao.id);

    if (!utilizador || !camiao || !empresa) {
      return erro("A sua conta ainda não tem um camião atribuído. Contacte a empresa.", 403);
    }
    if (!podeOperar) {
      return erro("A empresa não está aprovada ou o camião está inactivo.", 403);
    }
    if (!podeReceber) {
      return erro(
        "Active a sua disponibilidade com localização válida para aceitar solicitações.",
        403
      );
    }

    const { pedidoId } = schemaAceitarPedidoCondutor.parse(await req.json());

    const emCurso = await prisma.pedido.findFirst({
      where: { camiaoId: camiao.id, estado: { in: [...ESTADOS_EM_CURSO] } },
    });
    if (emCurso) {
      return erro("Já tem um serviço em execução. Conclua-o antes de aceitar outro.", 409);
    }

    // updateMany condicional: garante atomicidade e que o pedido foi dirigido a este camião.
    const resultado = await prisma.pedido.updateMany({
      where: {
        id: pedidoId,
        estado: "PENDENTE",
        camiaoId: camiao.id,
        criadoEm: { gte: new Date(Date.now() - EXPIRACAO_PEDIDO_MS) },
      },
      data: { estado: "ACEITE", empresaId: empresa.id, camiaoId: camiao.id },
    });

    if (resultado.count === 0) {
      return erro("Esta solicitação já foi cancelada, respondida ou expirou.", 409);
    }

    // Enquanto executa o serviço, sai da pesquisa de disponibilidade para novos pedidos.
    await prisma.camiao.update({
      where: { id: camiao.id },
      data: { disponivel: false },
    });

    await prisma.pedidoEvento.create({
      data: {
        pedidoId,
        estado: "ACEITE",
        nota: `${empresa.nome} aceitou · ${camiao.matricula} (condutor ${utilizador.nome})`,
      },
    });

    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
