import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, tratarErroApi } from "@/lib/api";
import { ESTADOS_EM_CURSO } from "@/lib/condutor";

export async function GET() {
  try {
    const sessao = await exigirPapel("CLIENTE");
    const pedidos = await prisma.pedido.findMany({
      where: { condutorId: sessao.id },
      orderBy: { criadoEm: "desc" },
      include: {
        empresa: { select: { nome: true, telefone: true } },
        camiao: {
          select: {
            matricula: true,
            motoristaNome: true,
            motoristaTelefone: true,
            lat: true,
            lng: true,
            partilhaLocalizacao: true,
          },
        },
        eventos: { select: { estado: true, criadoEm: true }, orderBy: { criadoEm: "asc" } },
        avaliacao: { select: { estrelas: true, comentario: true } },
      },
    });

    const pedidosSeguros = pedidos.map((p) => {
      const podeVerCamiao =
        p.camiao &&
        p.camiao.partilhaLocalizacao &&
        (ESTADOS_EM_CURSO as readonly string[]).includes(p.estado);
      return {
        ...p,
        camiao: p.camiao
          ? {
              matricula: p.camiao.matricula,
              motoristaNome: p.camiao.motoristaNome,
              motoristaTelefone: p.camiao.motoristaTelefone,
              lat: podeVerCamiao ? p.camiao.lat : 0,
              lng: podeVerCamiao ? p.camiao.lng : 0,
            }
          : null,
      };
    });

    return ok({ pedidos: pedidosSeguros });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
