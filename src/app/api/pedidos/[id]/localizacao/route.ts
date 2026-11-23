import { prisma } from "@/lib/prisma";
import { exigirPapel, Proibido } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { ESTADOS_EM_CURSO } from "@/lib/condutor";
import { calcularRotaOSRM, coordenadasValidas } from "@/lib/geo";
import { schemaLocalizacaoCondutor } from "@/lib/validations";
import type { NextRequest } from "next/server";

/** Localização actual do camião (usada no acompanhamento de serviço activo). */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessao = await exigirPapel("CLIENTE", "EMPRESA", "CONDUTOR", "ADMIN");
    const pedido = await prisma.pedido.findUnique({
      where: { id: params.id },
      include: {
        empresa: { select: { utilizadorId: true } },
        camiao: {
          select: {
            id: true,
            motoristaId: true,
            lat: true,
            lng: true,
            matricula: true,
            partilhaLocalizacao: true,
            localizacaoActualizadaEm: true,
          },
        },
      },
    });
    if (!pedido) return erro("Pedido não encontrado.", 404);

    const eDono = pedido.condutorId === sessao.id;
    const eEmpresa =
      sessao.papel === "EMPRESA" && pedido.empresa?.utilizadorId === sessao.id;
    const eCondutor =
      sessao.papel === "CONDUTOR" && pedido.camiao?.motoristaId === sessao.id;
    const eAdmin = sessao.papel === "ADMIN";
    if (!eDono && !eEmpresa && !eCondutor && !eAdmin) {
      throw new Proibido();
    }

    const emCurso = (ESTADOS_EM_CURSO as readonly string[]).includes(pedido.estado);
    const podeExpor = Boolean(
      pedido.camiao &&
        pedido.camiao.partilhaLocalizacao &&
        coordenadasValidas({ lat: pedido.camiao.lat, lng: pedido.camiao.lng }) &&
        (emCurso || eAdmin)
    );

    if (!podeExpor || !pedido.camiao) {
      return ok({ camiao: null, estado: pedido.estado, rota: null });
    }

    const camiaoPos = { lat: pedido.camiao.lat, lng: pedido.camiao.lng };
    const destinoRota =
      pedido.estado === "EM_TRANSPORTE" &&
      pedido.destinoLat != null &&
      pedido.destinoLng != null
        ? { lat: pedido.destinoLat, lng: pedido.destinoLng }
        : { lat: pedido.origemLat, lng: pedido.origemLng };
    const rota = await calcularRotaOSRM(camiaoPos, destinoRota);

    return ok({
      estado: pedido.estado,
      camiao: {
        lat: pedido.camiao.lat,
        lng: pedido.camiao.lng,
        actualizadaEm: pedido.camiao.localizacaoActualizadaEm ?? null,
      },
      rota,
    });
  } catch (e) {
    return tratarErroApi(e);
  }
}

/** Actualização real de posição GPS pelo condutor ou empresa durante serviço activo. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessao = await exigirPapel("CONDUTOR", "EMPRESA");
    const pedido = await prisma.pedido.findUnique({
      where: { id: params.id },
      include: { empresa: true, camiao: true },
    });
    if (!pedido || !pedido.camiaoId || !pedido.camiao) {
      return erro("Pedido ou camião não encontrado.", 404);
    }

    if (sessao.papel === "EMPRESA" && pedido.empresa?.utilizadorId !== sessao.id) {
      throw new Proibido();
    }
    if (sessao.papel === "CONDUTOR" && pedido.camiao.motoristaId !== sessao.id) {
      throw new Proibido();
    }

    if (!(ESTADOS_EM_CURSO as readonly string[]).includes(pedido.estado)) {
      return erro("Só é possível actualizar a localização durante um serviço activo.", 409);
    }

    const { lat, lng } = schemaLocalizacaoCondutor.parse(await req.json());
    if (!coordenadasValidas({ lat, lng })) {
      return erro("Coordenadas GPS inválidas.", 422);
    }

    await prisma.camiao.update({
      where: { id: pedido.camiaoId },
      data: {
        lat,
        lng,
        partilhaLocalizacao: true,
        localizacaoActualizadaEm: new Date(),
      },
    });
    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
