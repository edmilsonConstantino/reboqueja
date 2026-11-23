import { prisma } from "@/lib/prisma";
import { exigirSessao, Proibido } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { ESTADOS_EM_CURSO, mascararTelefone } from "@/lib/condutor";
import { calcularRotaOSRM, coordenadasValidas, haversineKm, type ResultadoRota } from "@/lib/geo";
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

/** Detalhe do pedido — cliente dono, empresa associada, condutor atribuído ou admin. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessao = await exigirSessao();
    const pedido = await carregarPedido(params.id);
    if (!pedido) return erro("Pedido não encontrado.", 404);

    const eDono = pedido.condutorId === sessao.id;
    const eEmpresa =
      sessao.papel === "EMPRESA" &&
      pedido.empresaId !== null &&
      pedido.empresa?.utilizadorId === sessao.id;
    const eCondutor =
      sessao.papel === "CONDUTOR" &&
      pedido.camiao !== null &&
      pedido.camiao.motoristaId === sessao.id;
    const eAdmin = sessao.papel === "ADMIN";

    if (!eDono && !eAdmin && !eEmpresa && !eCondutor) {
      throw new Proibido();
    }

    const expirado =
      pedido.estado === "PENDENTE" &&
      Date.now() - new Date(pedido.criadoEm).getTime() > EXPIRACAO_PEDIDO_MS;

    const emCurso = (ESTADOS_EM_CURSO as readonly string[]).includes(pedido.estado);
    const localizacaoCamiaoActiva = Boolean(
      pedido.camiao &&
        pedido.camiao.partilhaLocalizacao &&
        coordenadasValidas({ lat: pedido.camiao.lat, lng: pedido.camiao.lng }) &&
        (emCurso || eAdmin || eCondutor || eEmpresa)
    );

    const camiaoCoords =
      localizacaoCamiaoActiva && pedido.camiao
        ? { lat: pedido.camiao.lat, lng: pedido.camiao.lng }
        : null;

    const origem = { lat: pedido.origemLat, lng: pedido.origemLng };
    const destino =
      pedido.destinoLat != null && pedido.destinoLng != null
        ? { lat: pedido.destinoLat, lng: pedido.destinoLng }
        : null;

    let rota: ResultadoRota | null = null;
    let distanciaLinhaRetaKm: number | null = null;

    if (pedido.estado === "EM_TRANSPORTE" && destino) {
      const inicio = camiaoCoords ?? origem;
      distanciaLinhaRetaKm = Math.round(haversineKm(inicio, destino) * 100) / 100;
      rota = await calcularRotaOSRM(inicio, destino);
    } else if (camiaoCoords && ["ACEITE", "A_CAMINHO", "NO_LOCAL"].includes(pedido.estado)) {
      distanciaLinhaRetaKm = Math.round(haversineKm(camiaoCoords, origem) * 100) / 100;
      rota = await calcularRotaOSRM(camiaoCoords, origem);
    } else if (destino) {
      distanciaLinhaRetaKm = Math.round(haversineKm(origem, destino) * 100) / 100;
      rota = await calcularRotaOSRM(origem, destino);
    } else if (camiaoCoords && pedido.estado === "PENDENTE") {
      distanciaLinhaRetaKm = Math.round(haversineKm(camiaoCoords, origem) * 100) / 100;
    }

    // Privacidade:
    // - Cliente não vê coordenadas em tempo real quando o pedido está PENDENTE/CONCLUIDO/CANCELADO/RECUSADO
    //   ou quando a partilha está desligada.
    // - Condutor vê telefone mascarado enquanto o pedido está PENDENTE.
    const mascararContactoCliente = eCondutor && pedido.estado === "PENDENTE";
    const pedidoSeguro = {
      ...pedido,
      condutor: mascararContactoCliente
        ? { ...pedido.condutor, telefone: mascararTelefone(pedido.condutor.telefone) }
        : pedido.condutor,
      camiao: pedido.camiao
        ? {
            ...pedido.camiao,
            lat: localizacaoCamiaoActiva ? pedido.camiao.lat : 0,
            lng: localizacaoCamiaoActiva ? pedido.camiao.lng : 0,
          }
        : null,
    };

    return ok({
      pedido: pedidoSeguro,
      expirado,
      localizacaoCamiaoActiva,
      distanciaLinhaRetaKm,
      rota,
    });
  } catch (e) {
    return tratarErroApi(e);
  }
}

/** Cancelamento — cliente dono (se PENDENTE/ACEITE/A_CAMINHO) ou empresa/admin. */
export async function DELETE(
  _req: NextRequest,
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
