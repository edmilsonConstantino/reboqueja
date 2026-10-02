import { prisma } from "@/lib/prisma";
import { exigirPapel, Proibido } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { schemaAceitarPedido, schemaEstado } from "@/lib/validations";
import { PROXIMO_ESTADO, LABEL_ESTADO } from "@/lib/constants";
import type { NextRequest } from "next/server";

/** A empresa associa um camião e aceita o pedido (PENDENTE → ACEITE). */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const empresa = await prisma.empresa.findUnique({
      where: { utilizadorId: sessao.id },
    });
    if (!empresa) return erro("Empresa não encontrada.", 404);
    if (empresa.estadoAprovacao !== "APROVADA") {
      return erro(
        "A sua empresa ainda não foi aprovada pelo administrador.",
        403
      );
    }

    const pedido = await prisma.pedido.findUnique({ where: { id: params.id } });
    if (!pedido) return erro("Pedido não encontrado.", 404);
    if (pedido.estado !== "PENDENTE") {
      return erro("Este pedido já não está disponível.", 409);
    }

    const { camiaoId } = schemaAceitarPedido.parse(await req.json());
    const camiao = await prisma.camiao.findUnique({
      where: { id: camiaoId },
    });
    if (!camiao || camiao.empresaId !== empresa.id) {
      return erro("Escolha um camião da sua empresa.", 422);
    }

    await prisma.$transaction([
      prisma.pedido.update({
        where: { id: pedido.id },
        data: {
          estado: "ACEITE",
          empresaId: empresa.id,
          camiaoId: camiao.id,
        },
      }),
      prisma.pedidoEvento.create({
        data: {
          pedidoId: pedido.id,
          estado: "ACEITE",
          nota: `${empresa.nome} aceitou o pedido · ${camiao.matricula}`,
        },
      }),
    ]);

    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

/** A empresa recusa o pedido (recusa = remove a atribuição; permanece PENDENTE para outros). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const empresa = await prisma.empresa.findUnique({
      where: { utilizadorId: sessao.id },
    });
    if (!empresa) return erro("Empresa não encontrada.", 404);

    const pedido = await prisma.pedido.findUnique({ where: { id: params.id } });
    if (!pedido) return erro("Pedido não encontrado.", 404);

    // Regista a recusa como evento de auditoria (o pedido permanece visível a outras empresas)
    await prisma.pedidoEvento.create({
      data: {
        pedidoId: pedido.id,
        estado: "PENDENTE",
        nota: `${empresa.nome} recusou o pedido`,
      },
    });

    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

/** Avança o estado (A_CAMINHO → NO_LOCAL → EM_TRANSPORTE → CONCLUIDO). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const empresa = await prisma.empresa.findUnique({
      where: { utilizadorId: sessao.id },
    });
    if (!empresa) return erro("Empresa não encontrada.", 404);

    const pedido = await prisma.pedido.findUnique({ where: { id: params.id } });
    if (!pedido) return erro("Pedido não encontrado.", 404);
    if (pedido.empresaId !== empresa.id) throw new Proibido();

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

    await prisma.$transaction([
      prisma.pedido.update({
        where: { id: pedido.id },
        data: { estado },
      }),
      prisma.pedidoEvento.create({
        data: { pedidoId: pedido.id, estado },
      }),
    ]);

    return ok({ estado });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
