import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, tratarErroApi } from "@/lib/api";
import {
  contextoCondutor,
  ESTADOS_EM_CURSO,
  mascararTelefone,
} from "@/lib/condutor";
import { EXPIRACAO_PEDIDO_MS } from "@/lib/constants";
import { coordenadasValidas, haversineKm } from "@/lib/geo";

type PedidoBase = {
  id: string;
  estado: string;
  criadoEm: Date;
  origemLat: number;
  origemLng: number;
  origemEndereco: string;
  destinoLat: number | null;
  destinoLng: number | null;
  destinoEndereco: string | null;
  distanciaKm: number;
  tipoProblema: string;
  tipoVeiculo: string;
  precoMin: number;
  precoMax: number;
  observacoes: string | null;
  condutor: { nome: string; telefone: string };
};

const formatarPedido = (
  p: PedidoBase,
  camiaoPos: { lat: number; lng: number } | null,
  mascararContacto: boolean
) => ({
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
  distanciaAteRecolhaKm: camiaoPos
    ? Math.round(haversineKm(camiaoPos, { lat: p.origemLat, lng: p.origemLng }) * 10) / 10
    : null,
  tipoProblema: p.tipoProblema,
  tipoVeiculo: p.tipoVeiculo,
  precoMin: p.precoMin,
  precoMax: p.precoMax,
  observacoes: p.observacoes,
  cliente: {
    nome: p.condutor.nome,
    telefone: mascararContacto ? mascararTelefone(p.condutor.telefone) : p.condutor.telefone,
    contactoMascarado: mascararContacto,
  },
});

export async function GET() {
  try {
    const sessao = await exigirPapel("CONDUTOR");
    const {
      utilizador,
      camiao,
      empresa,
      podeOperar,
      podeReceber,
      localizacaoValida,
    } = await contextoCondutor(sessao.id);

    if (!utilizador || !camiao || !empresa) {
      return ok({
        condutor: { nome: utilizador?.nome ?? sessao.nome },
        camiao: null,
        empresa: null,
        podeOperar: false,
        podeReceber: false,
        localizacaoValida: false,
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

    const [activo, solicitacoes, avaliacoes, concluidosHoje, ganhosHoje] = await Promise.all([
      prisma.pedido.findFirst({
        where: { camiaoId: camiao.id, estado: { in: [...ESTADOS_EM_CURSO] } },
        orderBy: { criadoEm: "desc" },
        include: { condutor: { select: { nome: true, telefone: true } } },
      }),
      // Apenas solicitações reais dirigidas especificamente a este veículo/condutor
      !podeReceber
        ? Promise.resolve([])
        : prisma.pedido.findMany({
            where: {
              estado: "PENDENTE",
              camiaoId: camiao.id,
              criadoEm: { gte: limiteExpiracao },
            },
            orderBy: { criadoEm: "asc" },
            take: 10,
            include: { condutor: { select: { nome: true, telefone: true } } },
          }),
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

    const camiaoPos = coordenadasValidas({ lat: camiao.lat, lng: camiao.lng })
      ? { lat: camiao.lat, lng: camiao.lng }
      : null;

    return ok({
      condutor: { nome: utilizador.nome },
      camiao: {
        id: camiao.id,
        matricula: camiao.matricula,
        tipo: camiao.tipo,
        activo: camiao.activo,
        disponivel: Boolean(camiao.disponivel),
        partilhaLocalizacao: Boolean(camiao.partilhaLocalizacao),
        localizacaoActualizadaEm: camiao.localizacaoActualizadaEm ?? null,
        lat: camiao.lat,
        lng: camiao.lng,
      },
      empresa: {
        nome: empresa.nome,
        telefone: empresa.telefone,
        disponivel: empresa.disponivel,
        estadoAprovacao: empresa.estadoAprovacao,
      },
      podeOperar,
      podeReceber,
      localizacaoValida,
      activo: activo ? formatarPedido(activo, camiaoPos, false) : null,
      disponiveis: activo
        ? []
        : solicitacoes.map((p) => formatarPedido(p, camiaoPos, true)),
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
