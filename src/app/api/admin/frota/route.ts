import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, tratarErroApi } from "@/lib/api";
import { estadoOperacionalCamiao, type EstadoFrota } from "@/lib/camioes";
import { ESTADOS_EM_CURSO, localizacaoActualizada } from "@/lib/condutor";
import { EXPIRACAO_PEDIDO_MS } from "@/lib/constants";
import { coordenadasValidas } from "@/lib/geo";
import type { NextRequest } from "next/server";

export type { EstadoFrota };

export async function GET(req: NextRequest) {
  try {
    await exigirPapel("ADMIN");

    const empresaId = req.nextUrl.searchParams.get("empresaId") || "";
    const estadoDispFiltro = req.nextUrl.searchParams.get("estadoDisponibilidade") || "";
    const estadoServFiltro = req.nextUrl.searchParams.get("estadoServico") || "";

    const limiteExpiracao = new Date(Date.now() - EXPIRACAO_PEDIDO_MS);

    const [empresas, camioes] = await Promise.all([
      prisma.empresa.findMany({
        select: { id: true, nome: true, estadoAprovacao: true },
        orderBy: { nome: "asc" },
      }),
      prisma.camiao.findMany({
        where: { empresaId: empresaId || undefined },
        include: {
          empresa: { select: { id: true, nome: true, estadoAprovacao: true } },
          motorista: { select: { id: true, nome: true, telefone: true, email: true, activo: true } },
          _count: { select: { atribuicoes: true } },
          pedidos: {
            orderBy: { criadoEm: "desc" },
            include: {
              condutor: { select: { nome: true, telefone: true } },
            },
          },
        },
        orderBy: { matricula: "asc" },
      }),
    ]);

    const itens = camioes.map((c) => {
      const pedidoEmCurso = c.pedidos.find((p) =>
        (ESTADOS_EM_CURSO as readonly string[]).includes(p.estado)
      );
      const pedidoPendente = c.pedidos.find(
        (p) =>
          p.estado === "PENDENTE" &&
          new Date(p.criadoEm).getTime() >= limiteExpiracao.getTime()
      );
      const pedidoActivo = pedidoEmCurso ?? pedidoPendente ?? null;
      const locValida = localizacaoActualizada(c);
      const gpsActivo = Boolean(
        c.partilhaLocalizacao && coordenadasValidas({ lat: c.lat, lng: c.lng })
      );

      const estadoDisponibilidade = estadoOperacionalCamiao(
        {
          activo: c.activo,
          disponivel: c.disponivel,
          partilhaLocalizacao: c.partilhaLocalizacao,
          localizacaoActualizadaEm: c.localizacaoActualizadaEm,
          lat: c.lat,
          lng: c.lng,
          motoristaId: c.motoristaId,
          motorista: c.motorista,
        },
        Boolean(pedidoEmCurso)
      );

      return {
        id: c.id,
        matricula: c.matricula,
        marca: c.marca ?? null,
        modelo: c.modelo ?? null,
        tipo: c.tipo,
        capacidade: c.capacidade,
        activo: c.activo,
        disponivel: Boolean(c.disponivel),
        partilhaLocalizacao: Boolean(c.partilhaLocalizacao),
        localizacaoValida: locValida,
        gpsActivo,
        lat: gpsActivo ? c.lat : null,
        lng: gpsActivo ? c.lng : null,
        localizacaoActualizadaEm: c.localizacaoActualizadaEm ?? null,
        estadoDisponibilidade,
        empresa: c.empresa,
        condutor: c.motorista
          ? {
              id: c.motorista.id,
              nome: c.motorista.nome,
              telefone: c.motorista.telefone,
              email: c.motorista.email,
              activo: c.motorista.activo,
            }
          : null,
        totalAtribuicoes: c._count?.atribuicoes ?? 0,
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
          total: c.pedidos.length,
          concluidos: c.pedidos.filter((p) => p.estado === "CONCLUIDO").length,
          recusados: c.pedidos.filter((p) => p.estado === "RECUSADO").length,
          cancelados: c.pedidos.filter((p) => p.estado === "CANCELADO").length,
        },
      };
    });

    const filtrados = itens.filter((item) => {
      if (estadoDispFiltro && item.estadoDisponibilidade !== estadoDispFiltro) return false;
      if (estadoServFiltro && item.pedidoActivo?.estado !== estadoServFiltro) return false;
      return true;
    });

    const resumo = {
      totalVeiculos: itens.length,
      disponiveis: itens.filter((i) => i.estadoDisponibilidade === "DISPONIVEL").length,
      emServico: itens.filter((i) => i.estadoDisponibilidade === "EM_SERVICO").length,
      semCondutor: itens.filter((i) => i.estadoDisponibilidade === "SEM_CONDUTOR").length,
      indisponiveis: itens.filter(
        (i) =>
          i.estadoDisponibilidade === "INDISPONIVEL" ||
          i.estadoDisponibilidade === "GPS_EXPIRADO" ||
          i.estadoDisponibilidade === "INACTIVO" ||
          i.estadoDisponibilidade === "SEM_CONDUTOR"
      ).length,
      comLocalizacaoActiva: itens.filter((i) => i.gpsActivo).length,
    };

    return ok({ veiculos: filtrados, resumo, empresas });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
