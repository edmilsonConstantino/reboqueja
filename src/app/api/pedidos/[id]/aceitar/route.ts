import { prisma } from "@/lib/prisma";
import { exigirPapel, Proibido } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { ESTADOS_EM_CURSO } from "@/lib/condutor";
import { schemaAceitarPedido, schemaEstado } from "@/lib/validations";
import { PROXIMO_ESTADO, LABEL_ESTADO } from "@/lib/constants";
import type { NextRequest } from "next/server";

/** A empresa aceita o pedido dirigido a um dos seus camiões (PENDENTE → ACEITE). */
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
    if (pedido.empresaId && pedido.empresaId !== empresa.id) {
      throw new Proibido();
    }
    if (pedido.estado !== "PENDENTE") {
      return erro("Este pedido já não está pendente.", 409);
    }

    const { camiaoId } = schemaAceitarPedido.parse(await req.json());
    const camiao = await prisma.camiao.findUnique({
      where: { id: camiaoId },
      include: { motorista: { select: { id: true, activo: true } } },
    });
    if (!camiao || camiao.empresaId !== empresa.id) {
      return erro("Escolha um camião da sua empresa.", 422);
    }
    if (!camiao.activo) {
      return erro("Este camião está inactivo.", 422);
    }
    if (!camiao.motoristaId || !camiao.motorista?.activo) {
      return erro("Este camião não tem um condutor activo associado.", 422);
    }

    const emCursoNoCamiao = await prisma.pedido.findFirst({
      where: { camiaoId: camiao.id, estado: { in: [...ESTADOS_EM_CURSO] } },
    });
    if (emCursoNoCamiao) {
      return erro("Este camião já está a executar outro serviço.", 409);
    }

    const res = await prisma.pedido.updateMany({
      where: { id: pedido.id, estado: "PENDENTE" },
      data: {
        estado: "ACEITE",
        empresaId: empresa.id,
        camiaoId: camiao.id,
      },
    });
    if (res.count === 0) {
      return erro("Este pedido já foi respondido ou cancelado.", 409);
    }

    await prisma.camiao.update({
      where: { id: camiao.id },
      data: { disponivel: false },
    });

    await prisma.pedidoEvento.create({
      data: {
        pedidoId: pedido.id,
        estado: "ACEITE",
        nota: `${empresa.nome} aceitou o pedido · ${camiao.matricula}`,
      },
    });

    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

/** A empresa recusa o pedido dirigido a um dos seus veículos (PENDENTE → RECUSADO). */
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
    if (pedido.empresaId && pedido.empresaId !== empresa.id) {
      throw new Proibido();
    }

    const res = await prisma.pedido.updateMany({
      where: { id: pedido.id, estado: "PENDENTE" },
      data: { estado: "RECUSADO" },
    });
    if (res.count === 0) {
      return erro("Este pedido já não está pendente.", 409);
    }

    await prisma.pedidoEvento.create({
      data: {
        pedidoId: pedido.id,
        estado: "RECUSADO",
        nota: `${empresa.nome} recusou a solicitação`,
      },
    });

    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

/** Avança o estado (ACEITE → A_CAMINHO → NO_LOCAL → EM_TRANSPORTE → CONCLUIDO). */
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

    const pedido = await prisma.pedido.findUnique({
      where: { id: params.id },
      include: { camiao: true },
    });
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

    if (estado === "CONCLUIDO" && pedido.camiaoId && pedido.camiao && !pedido.camiao.disponivel) {
      await prisma.camiao.update({
        where: { id: pedido.camiaoId },
        data: { partilhaLocalizacao: false },
      });
    }

    return ok({ estado });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
