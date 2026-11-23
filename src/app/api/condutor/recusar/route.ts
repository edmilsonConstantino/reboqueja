import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { contextoCondutor } from "@/lib/condutor";
import { schemaRecusarPedidoCondutor } from "@/lib/validations";
import type { NextRequest } from "next/server";

/** POST: o condutor seleccionado recusa uma solicitação pendente (PENDENTE → RECUSADO). */
export async function POST(req: NextRequest) {
  try {
    const sessao = await exigirPapel("CONDUTOR");
    const { utilizador, camiao, empresa } = await contextoCondutor(sessao.id);

    if (!utilizador || !camiao || !empresa) {
      return erro("A sua conta ainda não tem um camião atribuído.", 403);
    }

    const { pedidoId, motivo } = schemaRecusarPedidoCondutor.parse(await req.json());
    const motivoLimpo = motivo?.trim() || "Recusado pelo condutor";

    const resultado = await prisma.pedido.updateMany({
      where: {
        id: pedidoId,
        estado: "PENDENTE",
        camiaoId: camiao.id,
      },
      data: {
        estado: "RECUSADO",
        motivoRecusa: motivoLimpo,
      },
    });

    if (resultado.count === 0) {
      return erro("Esta solicitação já foi respondida, cancelada ou não lhe pertence.", 409);
    }

    await prisma.pedidoEvento.create({
      data: {
        pedidoId,
        estado: "RECUSADO",
        nota: `${camiao.matricula} (${utilizador.nome}) recusou · ${motivoLimpo}`,
      },
    });

    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
