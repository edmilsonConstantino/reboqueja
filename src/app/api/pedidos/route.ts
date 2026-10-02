import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { schemaLocalizacao } from "@/lib/validations";
import { estaNaMatola, haversineKm, type LatLng } from "@/lib/geo";
import { VELOCIDADE_MEDIA_KMH } from "@/lib/constants";
import type { NextRequest } from "next/server";

export type EmpresaSugerida = {
  id: string;
  nome: string;
  lat: number;
  lng: number;
  media: number | null;
  precoMin: number;
  precoMax: number;
  distanciaKm: number;
  etaMin: number;
  camioesActivos: number;
};

/** GET: empresas disponíveis para a origem/tipo indicados (ordenadas por ETA). */
export async function GET(req: NextRequest) {
  try {
    await exigirPapel("CONDUTOR");

    const origemLat = parseFloat(req.nextUrl.searchParams.get("origemLat") || "");
    const origemLng = parseFloat(req.nextUrl.searchParams.get("origemLng") || "");
    const tipoVeiculo = req.nextUrl.searchParams.get("tipoVeiculo") || "LIGEIRO";
    if (Number.isNaN(origemLat) || Number.isNaN(origemLng)) {
      return erro("Coordenadas de origem inválidas.", 422);
    }

    const origem: LatLng = { lat: origemLat, lng: origemLng };
    if (!estaNaMatola(origem)) {
      return erro(
        "Serviço disponível apenas na Cidade da Matola. O local indicado está fora dos limites.",
        422
      );
    }

    const empresas = await prisma.empresa.findMany({
      where: {
        estadoAprovacao: "APROVADA",
        disponivel: true,
        consentimentoEm: { not: null },
        camioes: { some: { activo: true } },
      },
      include: {
        camioes: { where: { activo: true } },
        precos: { where: { tipoVeiculo } },
        pedidos: {
          where: { avaliacao: { isNot: null } },
          select: { avaliacao: { select: { estrelas: true } } },
        },
      },
    });

    const sugestoes: EmpresaSugerida[] = empresas
      .map((e) => {
        const distEmpresa = Math.min(
          ...e.camioes.map((c) => haversineKm({ lat: c.lat, lng: c.lng }, origem))
        );
        const preco = e.precos.find(
          (p) => origem && distEmpresa >= p.kmMin && distEmpresa <= p.kmMax
        );
        // Sem faixa exacta para este troço? Usa a primeira como referência.
        const faixa = preco || e.precos[0];
        return {
          id: e.id,
          nome: e.nome,
          lat: e.lat,
          lng: e.lng,
          media:
            e.pedidos.length > 0
              ? e.pedidos.reduce((s, p) => s + p.avaliacao!.estrelas, 0) /
                e.pedidos.length
              : null,
          precoMin: faixa?.precoMin ?? 0,
          precoMax: faixa?.precoMax ?? 0,
          distanciaKm: distEmpresa,
          etaMin: (distEmpresa / VELOCIDADE_MEDIA_KMH) * 60,
          camioesActivos: e.camioes.length,
        };
      })
      .filter((e) => Number.isFinite(e.distanciaKm))
      .sort((a, b) => a.etaMin - b.etaMin);

    return ok({ empresas: sugestoes });
  } catch (e) {
    return tratarErroApi(e);
  }
}

/** POST: cria o pedido e entra no estado PENDENTE (procura de empresa). */
export async function POST(req: NextRequest) {
  try {
    const sessao = await exigirPapel("CONDUTOR");
    const dados = schemaLocalizacao.parse(await req.json());

    const origem: LatLng = { lat: dados.origemLat, lng: dados.origemLng };
    const destino: LatLng = { lat: dados.destinoLat, lng: dados.destinoLng };

    if (!estaNaMatola(origem)) {
      return erro(
        "O local da avaria está fora dos limites da Cidade da Matola. O serviço só está disponível na Matola.",
        422
      );
    }
    if (!estaNaMatola(destino)) {
      return erro(
        "O destino escolhido está fora dos limites da Cidade da Matola. Escolha um destino na Matola.",
        422
      );
    }

    // Máximo de 1 pedido activo por condutor
    const activo = await prisma.pedido.findFirst({
      where: {
        condutorId: sessao.id,
        estado: { in: ["PENDENTE", "ACEITE", "A_CAMINHO", "NO_LOCAL", "EM_TRANSPORTE"] },
      },
    });
    if (activo) {
      return erro(
        "Já tem um pedido em curso. Acompanhe-o ou cancele antes de criar outro.",
        409
      );
    }

    const distanciaKm = haversineKm(origem, destino);

    // Faixa de preço de referência: média das empresas aprovadas e disponíveis
    const precos = await prisma.faixaPreco.findMany({
      where: {
        tipoVeiculo: dados.tipoVeiculo,
        kmMin: { lte: distanciaKm },
        kmMax: { gte: distanciaKm },
        empresa: {
          estadoAprovacao: "APROVADA",
          consentimentoEm: { not: null },
        },
      },
    });
    const precoMin = precos.length
      ? Math.min(...precos.map((p) => p.precoMin))
      : 500;
    const precoMax = precos.length
      ? Math.max(...precos.map((p) => p.precoMax))
      : 2000;

    const pedido = await prisma.pedido.create({
      data: {
        condutorId: sessao.id,
        veiculoId: null,
        origemLat: dados.origemLat,
        origemLng: dados.origemLng,
        origemEndereco: dados.origemEndereco,
        destinoLat: dados.destinoLat,
        destinoLng: dados.destinoLng,
        destinoEndereco: dados.destinoEndereco,
        distanciaKm,
        tipoProblema: dados.tipoProblema,
        tipoVeiculo: dados.tipoVeiculo,
        observacoes: dados.observacoes || null,
        estado: "PENDENTE",
        precoMin,
        precoMax,
        eventos: { create: { estado: "PENDENTE", nota: "Pedido criado" } },
      },
    });

    return ok({ id: pedido.id, precoMin, precoMax }, 201);
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
