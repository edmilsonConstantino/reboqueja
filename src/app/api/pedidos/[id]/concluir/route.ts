import { prisma } from "@/lib/prisma";
import { exigirSessao, exigirPapel, Proibido } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { schemaConcluir } from "@/lib/validations";
import { METODOS_PAGAMENTO } from "@/lib/constants";
import type { NextRequest } from "next/server";

/**
 * Conclusão pelo condutor: define o método de pagamento e guarda a avaliação 1–5.
 * O pagamento em si é simulado — a empresa confirma o recebimento.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessao = await exigirSessao();
    const pedido = await prisma.pedido.findUnique({
      where: { id: params.id },
      include: { avaliacao: true },
    });
    if (!pedido) return erro("Pedido não encontrado.", 404);
    if (pedido.condutorId !== sessao.id) {
      return erro("Só o condutor que criou o pedido pode concluí-lo.", 403);
    }
    if (pedido.estado !== "CONCLUIDO") {
      return erro("O serviço ainda não foi concluído pela empresa.", 409);
    }
    if (pedido.avaliacao) {
      return erro("Este pedido já foi avaliado.", 409);
    }

    const dados = schemaConcluir.parse(await req.json());

    await prisma.$transaction([
      prisma.pedido.update({
        where: { id: pedido.id },
        data: { metodoPagamento: dados.metodoPagamento },
      }),
      prisma.avaliacao.create({
        data: {
          pedidoId: pedido.id,
          estrelas: dados.estrelas,
          comentario: dados.comentario || null,
        },
      }),
    ]);

    const metodo = METODOS_PAGAMENTO.find(
      (m) => m.value === dados.metodoPagamento
    );

    return ok({
      sucesso: true,
      mensagem: `Obrigado! A empresa confirmará o recebimento (${metodo?.label}).`,
    });
  } catch (e) {
    return tratarErroApi(e);
  }
}

/** A empresa confirma o recebimento do pagamento. */
export async function PATCH(
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
    if (pedido.empresaId !== empresa.id) throw new Proibido();
    if (!pedido.metodoPagamento) {
      return erro("O condutor ainda não indicou o método de pagamento.", 409);
    }

    await prisma.pedido.update({
      where: { id: pedido.id },
      data: { pagamentoConfirmado: true },
    });
    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
