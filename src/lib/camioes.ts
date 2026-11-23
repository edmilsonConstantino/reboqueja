import "server-only";
import { prisma } from "@/lib/prisma";
import { ErroApi } from "@/lib/api";
import { ESTADOS_EM_CURSO, localizacaoActualizada } from "@/lib/condutor";
import { EXPIRACAO_PEDIDO_MS } from "@/lib/constants";

export type EstadoFrota =
  | "DISPONIVEL"
  | "EM_SERVICO"
  | "INDISPONIVEL"
  | "GPS_EXPIRADO"
  | "SEM_CONDUTOR"
  | "INACTIVO";

export function estadoOperacionalCamiao(
  camiao: {
    activo: boolean;
    disponivel?: boolean | null;
    partilhaLocalizacao?: boolean | null;
    localizacaoActualizadaEm?: Date | string | null;
    lat: number;
    lng: number;
    motoristaId?: string | null;
    motorista?: { id: string; activo: boolean } | null;
    empresa?: {
      estadoAprovacao: string;
      consentimentoEm?: Date | string | null;
    } | null;
  },
  emCurso: boolean
): EstadoFrota {
  if (emCurso) return "EM_SERVICO";
  if (!camiao.activo) return "INACTIVO";
  if (!camiao.motoristaId || !camiao.motorista) return "SEM_CONDUTOR";
  if (!camiao.motorista.activo) return "INACTIVO";
  if (
    camiao.empresa &&
    (camiao.empresa.estadoAprovacao !== "APROVADA" || !camiao.empresa.consentimentoEm)
  ) {
    return "INDISPONIVEL";
  }
  if (camiao.disponivel && localizacaoActualizada(camiao)) return "DISPONIVEL";
  if (camiao.disponivel) return "GPS_EXPIRADO";
  return "INDISPONIVEL";
}

/**
 * Valida e associa (ou desassocia, quando `motoristaId === null`) um condutor a um camião.
 * Regras aplicadas atomicamente:
 * - O camião não pode ter serviço em curso nem pedido pendente por responder.
 * - O condutor deve ter papel CONDUTOR, conta activa e pertencer à mesma empresa do camião.
 * - O mesmo condutor não pode estar associado simultaneamente a outro camião.
 * - A atribuição anterior é encerrada (`fimEm`) no histórico sem apagar os dados do condutor anterior.
 * - A atribuição administrativa nunca activa automaticamente a disponibilidade nem a partilha GPS do condutor.
 */
export async function atribuirCondutorAoCamiao(params: {
  camiaoId: string;
  motoristaId: string | null;
  atribuidoPorId?: string | null;
  motivo?: string | null;
}) {
  const { camiaoId, motoristaId, atribuidoPorId, motivo } = params;
  const agora = new Date();
  const limiteExpiracao = new Date(Date.now() - EXPIRACAO_PEDIDO_MS);

  return prisma.$transaction(async (tx) => {
    const camiao = await tx.camiao.findUnique({
      where: { id: camiaoId },
      include: {
        motorista: { select: { id: true, nome: true, empresaCondutorId: true } },
      },
    });
    if (!camiao) {
      throw new ErroApi("Camião não encontrado.", 404);
    }

    if (camiao.motoristaId === motoristaId) {
      return { camiao, alterado: false };
    }

    const pedidoActivo = await tx.pedido.findFirst({
      where: {
        camiaoId: camiao.id,
        OR: [
          { estado: { in: [...ESTADOS_EM_CURSO] } },
          { estado: "PENDENTE", criadoEm: { gte: limiteExpiracao } },
        ],
      },
      select: { id: true, estado: true },
    });
    if (pedidoActivo) {
      throw new ErroApi(
        "Não é possível alterar o condutor enquanto o camião tem um serviço em curso ou solicitação pendente.",
        409
      );
    }

    let novoMotorista: {
      id: string;
      nome: string;
      telefone: string;
      papel: string;
      activo: boolean;
      empresaCondutorId: string | null;
    } | null = null;

    if (motoristaId !== null) {
      const condutor = await tx.utilizador.findUnique({
        where: { id: motoristaId },
        select: {
          id: true,
          nome: true,
          telefone: true,
          papel: true,
          activo: true,
          empresaCondutorId: true,
          camiao: { select: { id: true, empresaId: true } },
        },
      });
      if (!condutor) {
        throw new ErroApi("Condutor seleccionado não encontrado.", 404);
      }
      if (condutor.papel !== "CONDUTOR") {
        throw new ErroApi("O utilizador seleccionado não tem perfil de condutor.", 422);
      }
      if (!condutor.activo) {
        throw new ErroApi("Não é possível atribuir um condutor inactivo.", 422);
      }

      const empresaDoCondutor = condutor.empresaCondutorId ?? condutor.camiao?.empresaId ?? null;
      if (empresaDoCondutor && empresaDoCondutor !== camiao.empresaId) {
        throw new ErroApi("O condutor deve pertencer à mesma empresa do camião.", 422);
      }
      if (!empresaDoCondutor) {
        throw new ErroApi("O condutor não está vinculado à empresa deste camião.", 422);
      }

      const outroCamiao = await tx.camiao.findFirst({
        where: { motoristaId: condutor.id, id: { not: camiao.id } },
        select: { id: true, matricula: true },
      });
      if (outroCamiao) {
        throw new ErroApi(
          `Este condutor já está associado ao camião ${outroCamiao.matricula}.`,
          409
        );
      }

      novoMotorista = condutor;
    }

    // Garante que o condutor anterior mantém o vínculo à empresa antes de ser desassociado
    if (camiao.motorista && !camiao.motorista.empresaCondutorId) {
      await tx.utilizador.update({
        where: { id: camiao.motorista.id },
        data: { empresaCondutorId: camiao.empresaId },
      });
    }

    // Encerra qualquer atribuição aberta mantendo o registo histórico e os dados do condutor anterior
    await tx.atribuicaoCamiao.updateMany({
      where: { camiaoId: camiao.id, fimEm: null },
      data: { fimEm: agora },
    });

    if (novoMotorista) {
      if (!novoMotorista.empresaCondutorId) {
        await tx.utilizador.update({
          where: { id: novoMotorista.id },
          data: { empresaCondutorId: camiao.empresaId },
        });
      }

      await tx.atribuicaoCamiao.create({
        data: {
          camiaoId: camiao.id,
          motoristaId: novoMotorista.id,
          atribuidoPorId: atribuidoPorId ?? null,
          inicioEm: agora,
          fimEm: null,
          motivo:
            motivo?.trim() ||
            (camiao.motoristaId
              ? "Substituição administrativa de condutor"
              : "Atribuição administrativa de condutor"),
        },
      });
    }

    const actualizado = await tx.camiao.update({
      where: { id: camiao.id },
      data: {
        motoristaId: novoMotorista ? novoMotorista.id : null,
        motoristaNome: novoMotorista ? novoMotorista.nome : "",
        motoristaTelefone: novoMotorista ? novoMotorista.telefone : "",
        // A atribuição administrativa nunca activa automaticamente a disponibilidade/GPS
        disponivel: false,
        partilhaLocalizacao: false,
        localizacaoActualizadaEm: null,
        lat: 0,
        lng: 0,
      },
    });

    return { camiao: actualizado, alterado: true };
  });
}
