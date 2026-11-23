import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { contextoCondutor, ESTADOS_ACTIVOS } from "@/lib/condutor";
import { EXPIRACAO_PEDIDO_MS } from "@/lib/constants";
import { schemaAceitarPedidoCondutor } from "@/lib/validations";
import type { NextRequest } from "next/server";

/** O condutor aceita um pedido pendente (PENDENTE → ACEITE). */
export async function POST(req: NextRequest) {
  try {
    const sessao = await exigirPapel("CONDUTOR");
    const { utilizador, camiao, empresa, podeReceber } = await contextoCondutor(sessao.id);

    if (!utilizador || !camiao || !empresa) {
      return erro("A sua conta ainda não tem um camião atribuído. Contacte a empresa.", 403);
    }
    if (!podeReceber) {
      return erro(
        "O camião está inactivo ou a empresa está offline. Não é possível aceitar pedidos agora.",
        403
      );
    }

    const { pedidoId } = schemaAceitarPedidoCondutor.parse(await req.json());

    const emCurso = await prisma.pedido.findFirst({
      where: { camiaoId: camiao.id, estado: { in: [...ESTADOS_ACTIVOS] } },
    });
    if (emCurso) {
      return erro("Já tem um serviço em curso. Conclua-o antes de aceitar outro.", 409);
    }

    // updateMany condicional: só ganha quem encontrar o pedido ainda PENDENTE.
    const resultado = await prisma.pedido.updateMany({
      where: {
        id: pedidoId,
        estado: "PENDENTE",
        empresaId: null,
        criadoEm: { gte: new Date(Date.now() - EXPIRACAO_PEDIDO_MS) },
      },
      data: { estado: "ACEITE", empresaId: empresa.id, camiaoId: camiao.id },
    });

    if (resultado.count === 0) {
      return erro("Este pedido já foi aceite por outra empresa ou expirou.", 409);
    }

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
