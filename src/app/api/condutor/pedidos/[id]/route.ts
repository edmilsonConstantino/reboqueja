import { prisma } from "@/lib/prisma";
import { exigirPapel, Proibido } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { contextoCondutor } from "@/lib/condutor";
import { PROXIMO_ESTADO, LABEL_ESTADO } from "@/lib/constants";
import { schemaEstado } from "@/lib/validations";
import type { NextRequest } from "next/server";

/** PATCH: o condutor avança o estado (A_CAMINHO → NO_LOCAL → EM_TRANSPORTE → CONCLUIDO). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessao = await exigirPapel("CONDUTOR");
    const { camiao } = await contextoCondutor(sessao.id);
    if (!camiao) return erro("A sua conta não tem um camião atribuído.", 403);

    const pedido = await prisma.pedido.findUnique({ where: { id: params.id } });
    if (!pedido) return erro("Pedido não encontrado.", 404);
    if (pedido.camiaoId !== camiao.id) throw new Proibido();

    const { estado } = schemaEstado.parse(await req.json());
    const esperado = PROXIMO_ESTADO[pedido.estado];
    if (!esperado || estado !== esperado) {
      return erro(
        `Transição inválida: de ${LABEL_ESTADO[pedido.estado]} só pode avançar para ${
          esperado ? LABEL_ESTADO[esperado] : "—"
        }.`,
        409
      );
    }

    const resultado = await prisma.pedido.updateMany({
      where: { id: pedido.id, estado: pedido.estado, camiaoId: camiao.id },
      data: { estado },
    });
    if (resultado.count === 0) {
      return erro("O estado deste pedido mudou entretanto. Actualize a página.", 409);
    }

    await prisma.pedidoEvento.create({
      data: { pedidoId: pedido.id, estado, nota: `Actualizado pelo condutor ${sessao.nome}` },
    });

    if (estado === "CONCLUIDO" && !camiao.disponivel) {
      await prisma.camiao.update({
        where: { id: camiao.id },
        data: { partilhaLocalizacao: false },
      });
    }

    return ok({ estado });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
