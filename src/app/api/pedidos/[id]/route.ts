import { prisma } from "@/lib/prisma";
import { exigirSessao, NaoAutorizado, Proibido } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { EXPIRACAO_PEDIDO_MS } from "@/lib/constants";
import type { NextRequest } from "next/server";

async function carregarPedido(id: string) {
  return prisma.pedido.findUnique({
    where: { id },
    include: {
      condutor: {
        select: { id: true, nome: true, telefone: true },
      },
      veiculo: true,
      empresa: true,
      camiao: true,
      eventos: { orderBy: { criadoEm: "asc" } },
      avaliacao: true,
    },
  });
}

export type DetalhePedido = NonNullable<
  Awaited<ReturnType<typeof carregarPedido>>
>;

/** Detalhe do pedido — condutor dono, empresa associada ou admin. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessao = await exigirSessao();
    const pedido = await carregarPedido(params.id);
    if (!pedido) return erro("Pedido não encontrado.", 404);

    const eDono = pedido.condutorId === sessao.id;
    const eEmpresa = sessao.papel === "EMPRESA" && pedido.empresaId !== null;
    const eAdmin = sessao.papel === "ADMIN";
    if (!eDono && !eAdmin && !(eEmpresa && pedido.empresa?.utilizadorId === sessao.id)) {
      throw new Proibido();
    }

    const expirado =
      pedido.estado === "PENDENTE" &&
      Date.now() - new Date(pedido.criadoEm).getTime() > EXPIRACAO_PEDIDO_MS;

    return ok({ pedido, expirado });
  } catch (e) {
    return tratarErroApi(e);
  }
}

/** Cancelamento — condutor dono (se PENDENTE/ACEITE/A_CAMINHO) ou empresa/admin. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessao = await exigirSessao();
    const pedido = await carregarPedido(params.id);
    if (!pedido) return erro("Pedido não encontrado.", 404);

    const eDono = pedido.condutorId === sessao.id;
    const eEmpresa =
      sessao.papel === "EMPRESA" && pedido.empresa?.utilizadorId === sessao.id;
    const eAdmin = sessao.papel === "ADMIN";
    if (!eDono && !eEmpresa && !eAdmin) throw new Proibido();

    const cancelaveis = ["PENDENTE", "ACEITE", "A_CAMINHO"];
    if (!cancelaveis.includes(pedido.estado)) {
      return erro(
        "Este pedido já não pode ser cancelado (estado actual: " +
          pedido.estado +
          ").",
        409
      );
    }
    if (pedido.estado === "NO_LOCAL" || pedido.estado === "EM_TRANSPORTE") {
      return erro("Não é possível cancelar neste estado.", 409);
    }

    await prisma.$transaction([
      prisma.pedido.update({
        where: { id: pedido.id },
        data: {
          estado: "CANCELADO",
          canceladoPor: sessao.papel,
        },
      }),
      prisma.pedidoEvento.create({
        data: {
          pedidoId: pedido.id,
          estado: "CANCELADO",
          nota: `Cancelado pelo ${sessao.papel.toLowerCase()}`,
        },
      }),
    ]);

    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
