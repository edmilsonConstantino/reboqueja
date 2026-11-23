import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, tratarErroApi } from "@/lib/api";
import { contextoCondutor, ESTADOS_ACTIVOS } from "@/lib/condutor";
import { EXPIRACAO_PEDIDO_MS } from "@/lib/constants";

type PedidoBase = {
  id: string;
  estado: string;
  criadoEm: Date;
  origemLat: number;
  origemLng: number;
  origemEndereco: string;
  destinoLat: number;
  destinoLng: number;
  destinoEndereco: string;
  distanciaKm: number;
  tipoProblema: string;
  tipoVeiculo: string;
  precoMin: number;
  precoMax: number;
  observacoes: string | null;
  condutor: { nome: string; telefone: string };
};

const paraPedido = (p: PedidoBase) => ({
  id: p.id,
  estado: p.estado,
  criadoEm: p.criadoEm,
  origemLat: p.origemLat,
  origemLng: p.origemLng,
  origemEndereco: p.origemEndereco,
  destinoLat: p.destinoLat,
  destinoLng: p.destinoLng,
  destinoEndereco: p.destinoEndereco,
  distanciaKm: p.distanciaKm,
  tipoProblema: p.tipoProblema,
  tipoVeiculo: p.tipoVeiculo,
  precoMin: p.precoMin,
  precoMax: p.precoMax,
  observacoes: p.observacoes,
  cliente: { nome: p.condutor.nome, telefone: p.condutor.telefone },
});

export async function GET() {
  try {
    const sessao = await exigirPapel("CONDUTOR");
    const { utilizador, camiao, empresa, podeReceber } = await contextoCondutor(sessao.id);

    if (!utilizador || !camiao || !empresa) {
      return ok({
        condutor: { nome: utilizador?.nome ?? sessao.nome },
        camiao: null,
        empresa: null,
        podeReceber: false,
        activo: null,
        disponiveis: [],
        media: null,
        totalAvaliacoes: 0,
        hoje: { concluidos: 0, receitaMin: 0, receitaMax: 0 },
      });
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const limiteExpiracao = new Date(Date.now() - EXPIRACAO_PEDIDO_MS);

    const [activo, disponiveis, avaliacoes, concluidosHoje, ganhosHoje] = await Promise.all([
      prisma.pedido.findFirst({
        where: { camiaoId: camiao.id, estado: { in: [...ESTADOS_ACTIVOS] } },
        orderBy: { criadoEm: "desc" },
        include: { condutor: { select: { nome: true, telefone: true } } },
      }),
      podeReceber
        ? prisma.pedido.findMany({
            where: {
              estado: "PENDENTE",
              empresaId: null,
              criadoEm: { gte: limiteExpiracao },
            },
            orderBy: { criadoEm: "asc" },
            take: 20,
            include: { condutor: { select: { nome: true, telefone: true } } },
          })
        : Promise.resolve([]),
      prisma.avaliacao.findMany({
        where: { pedido: { camiaoId: camiao.id } },
        select: { estrelas: true },
      }),
      prisma.pedido.count({
        where: { camiaoId: camiao.id, estado: "CONCLUIDO", actualizadoEm: { gte: hoje } },
      }),
      prisma.pedido.aggregate({
        where: { camiaoId: camiao.id, estado: "CONCLUIDO", actualizadoEm: { gte: hoje } },
        _sum: { precoMin: true, precoMax: true },
      }),
    ]);

    return ok({
      condutor: { nome: utilizador.nome },
      camiao: {
        id: camiao.id,
        matricula: camiao.matricula,
        tipo: camiao.tipo,
        activo: camiao.activo,
      },
      empresa: {
        nome: empresa.nome,
        telefone: empresa.telefone,
        disponivel: empresa.disponivel,
        estadoAprovacao: empresa.estadoAprovacao,
      },
      podeReceber,
      activo: activo ? paraPedido(activo) : null,
      // Com um serviço em curso o condutor não vê (nem aceita) outros pedidos.
      disponiveis: activo ? [] : disponiveis.map(paraPedido),
      media:
        avaliacoes.length > 0
          ? avaliacoes.reduce((s, a) => s + a.estrelas, 0) / avaliacoes.length
          : null,
      totalAvaliacoes: avaliacoes.length,
      hoje: {
        concluidos: concluidosHoje,
        receitaMin: ganhosHoje._sum.precoMin ?? 0,
        receitaMax: ganhosHoje._sum.precoMax ?? 0,
      },
    });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
