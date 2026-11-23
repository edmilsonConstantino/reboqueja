import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { atribuirCondutorAoCamiao, estadoOperacionalCamiao } from "@/lib/camioes";
import { ESTADOS_EM_CURSO, localizacaoActualizada } from "@/lib/condutor";
import { EXPIRACAO_PEDIDO_MS } from "@/lib/constants";
import { coordenadasValidas } from "@/lib/geo";
import { schemaAdminActualizarCamiao } from "@/lib/validations";
import type { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await exigirPapel("ADMIN");

    const camiao = await prisma.camiao.findUnique({
      where: { id: params.id },
      include: {
        empresa: {
          select: {
            id: true,
            nome: true,
            endereco: true,
            telefone: true,
            estadoAprovacao: true,
            consentimentoEm: true,
          },
        },
        motorista: {
          select: {
            id: true,
            nome: true,
            telefone: true,
            email: true,
            activo: true,
            criadoEm: true,
            empresaCondutorId: true,
          },
        },
        pedidos: {
          orderBy: { criadoEm: "desc" },
          include: {
            condutor: { select: { nome: true, telefone: true } },
          },
        },
        atribuicoes: {
          orderBy: { inicioEm: "desc" },
          include: {
            motorista: {
              select: { id: true, nome: true, telefone: true, email: true, activo: true },
            },
            atribuidoPor: { select: { id: true, nome: true } },
          },
        },
      },
    });

    if (!camiao) {
      return erro("Camião não encontrado.", 404);
    }

    const condutoresEmpresa = await prisma.utilizador.findMany({
      where: {
        papel: "CONDUTOR",
        OR: [
          { empresaCondutorId: camiao.empresaId },
          { camiao: { empresaId: camiao.empresaId } },
        ],
      },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        telefone: true,
        email: true,
        activo: true,
        criadoEm: true,
        empresaCondutorId: true,
        camiao: { select: { id: true, matricula: true } },
      },
    });

    const limiteExpiracao = new Date(Date.now() - EXPIRACAO_PEDIDO_MS);
    const pedidoEmCurso = camiao.pedidos.find((p) =>
      (ESTADOS_EM_CURSO as readonly string[]).includes(p.estado)
    );
    const pedidoPendente = camiao.pedidos.find(
      (p) =>
        p.estado === "PENDENTE" &&
        new Date(p.criadoEm).getTime() >= limiteExpiracao.getTime()
    );
    const pedidoActivo = pedidoEmCurso ?? pedidoPendente ?? null;
    const locValida = localizacaoActualizada(camiao);
    const gpsActivo = Boolean(
      camiao.partilhaLocalizacao && coordenadasValidas({ lat: camiao.lat, lng: camiao.lng })
    );

    const estadoDisponibilidade = estadoOperacionalCamiao(
      {
        activo: camiao.activo,
        disponivel: camiao.disponivel,
        partilhaLocalizacao: camiao.partilhaLocalizacao,
        localizacaoActualizadaEm: camiao.localizacaoActualizadaEm,
        lat: camiao.lat,
        lng: camiao.lng,
        motoristaId: camiao.motoristaId,
        motorista: camiao.motorista,
        empresa: camiao.empresa,
      },
      Boolean(pedidoEmCurso)
    );

    return ok({
      camiao: {
        id: camiao.id,
        empresaId: camiao.empresaId,
        matricula: camiao.matricula,
        marca: camiao.marca ?? null,
        modelo: camiao.modelo ?? null,
        tipo: camiao.tipo,
        capacidade: camiao.capacidade,
        activo: camiao.activo,
        disponivel: Boolean(camiao.disponivel),
        partilhaLocalizacao: Boolean(camiao.partilhaLocalizacao),
        localizacaoValida: locValida,
        gpsActivo,
        lat: gpsActivo ? camiao.lat : null,
        lng: gpsActivo ? camiao.lng : null,
        localizacaoActualizadaEm: camiao.localizacaoActualizadaEm ?? null,
        estadoDisponibilidade,
        empresa: {
          id: camiao.empresa.id,
          nome: camiao.empresa.nome,
          bairro:
            camiao.empresa.endereco.split(",").slice(-2, -1)[0]?.trim() ||
            camiao.empresa.endereco,
          telefone: camiao.empresa.telefone,
          estadoAprovacao: camiao.empresa.estadoAprovacao,
        },
        condutorActual: camiao.motorista,
        pedidoActivo: pedidoActivo
          ? {
              id: pedidoActivo.id,
              estado: pedidoActivo.estado,
              origemEndereco: pedidoActivo.origemEndereco,
              destinoEndereco: pedidoActivo.destinoEndereco,
              clienteNome: pedidoActivo.condutor.nome,
              criadoEm: pedidoActivo.criadoEm,
            }
          : null,
        resumoPedidos: {
          total: camiao.pedidos.length,
          concluidos: camiao.pedidos.filter((p) => p.estado === "CONCLUIDO").length,
          recusados: camiao.pedidos.filter((p) => p.estado === "RECUSADO").length,
          cancelados: camiao.pedidos.filter((p) => p.estado === "CANCELADO").length,
        },
        atribuicoes: camiao.atribuicoes,
      },
      condutoresEmpresa: condutoresEmpresa.map((c) => ({
        ...c,
        disponivelParaAtribuir: Boolean(c.activo && (!c.camiao || c.camiao.id === camiao.id)),
      })),
    });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessao = await exigirPapel("ADMIN");
    const corpo = (await req.json()) as Record<string, unknown>;
    const dados = schemaAdminActualizarCamiao.parse(corpo);

    const existente = await prisma.camiao.findUnique({
      where: { id: params.id },
      select: { id: true, empresaId: true, matricula: true, activo: true },
    });
    if (!existente) {
      return erro("Camião não encontrado.", 404);
    }

    if (dados.matricula) {
      const normalizada = dados.matricula.trim().toUpperCase();
      const duplicada = await prisma.camiao.findFirst({
        where: { matricula: normalizada, id: { not: existente.id } },
        select: { id: true },
      });
      if (duplicada) {
        return erro(`Já existe outro camião com a matrícula ${normalizada}.`, 409);
      }
    }

    if (dados.activo === false) {
      const pedidoEmCurso = await prisma.pedido.findFirst({
        where: {
          camiaoId: existente.id,
          OR: [
            { estado: { in: [...ESTADOS_EM_CURSO] } },
            { estado: "PENDENTE", criadoEm: { gte: new Date(Date.now() - EXPIRACAO_PEDIDO_MS) } },
          ],
        },
        select: { id: true },
      });
      if (pedidoEmCurso) {
        return erro(
          "Não é possível desactivar este camião enquanto tem um serviço em curso ou solicitação pendente.",
          409
        );
      }
    }

    const temCamposTecnicos =
      dados.matricula !== undefined ||
      dados.marca !== undefined ||
      dados.modelo !== undefined ||
      dados.tipo !== undefined ||
      dados.capacidade !== undefined ||
      dados.activo !== undefined;

    if (temCamposTecnicos) {
      await prisma.camiao.update({
        where: { id: existente.id },
        data: {
          ...(dados.matricula !== undefined
            ? { matricula: dados.matricula.trim().toUpperCase() }
            : {}),
          ...(dados.marca !== undefined ? { marca: dados.marca.trim() } : {}),
          ...(dados.modelo !== undefined ? { modelo: dados.modelo.trim() } : {}),
          ...(dados.tipo !== undefined ? { tipo: dados.tipo } : {}),
          ...(dados.capacidade !== undefined
            ? { capacidade: dados.capacidade?.trim() || null }
            : {}),
          ...(dados.activo !== undefined
            ? {
                activo: dados.activo,
                ...(dados.activo === false
                  ? { disponivel: false, partilhaLocalizacao: false }
                  : {}),
              }
            : {}),
        },
      });
    }

    if ("motoristaId" in dados) {
      await atribuirCondutorAoCamiao({
        camiaoId: existente.id,
        motoristaId: dados.motoristaId ?? null,
        atribuidoPorId: sessao.id,
        motivo: dados.motivo,
      });
    }

    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
