import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { schemaLocalizacao } from "@/lib/validations";
import { ESTADOS_ACTIVOS, ESTADOS_EM_CURSO, localizacaoActualizada } from "@/lib/condutor";
import {
  calcularRotaOSRM,
  coordenadasValidas,
  estaNaMatola,
  haversineKm,
  type LatLng,
} from "@/lib/geo";
import {
  EXPIRACAO_PEDIDO_MS,
  RAIO_PESQUISA_PADRAO_KM,
} from "@/lib/constants";
import type { NextRequest } from "next/server";

export type VeiculoDisponivel = {
  camiaoId: string;
  matricula: string;
  tipoCamiao: string;
  capacidade: string | null;
  motoristaNome: string;
  lat: number;
  lng: number;
  localizacaoActualizadaEm: string;
  empresaId: string;
  empresaNome: string;
  empresaBairro: string;
  media: number | null;
  totalAvaliacoes: number;
  precoMin: number | null;
  precoMax: number | null;
  distanciaLinhaRetaKm: number;
  distanciaEstradaKm: number | null;
  tempoEstimadoMin: number | null;
  fonteRota: "OSRM" | "INDISPONIVEL";
  distanciaServicoKm: number | null;
};

function escolherFaixaPreco(
  precos: { kmMin: number; kmMax: number; precoMin: number; precoMax: number }[],
  distanciaRefKm: number
) {
  if (precos.length === 0) return null;
  const ordenadas = [...precos].sort((a, b) => a.kmMin - b.kmMin);
  return (
    ordenadas.find((p) => distanciaRefKm >= p.kmMin && distanciaRefKm <= p.kmMax) ??
    ordenadas.find((p) => distanciaRefKm <= p.kmMax) ??
    ordenadas[ordenadas.length - 1]
  );
}

/**
 * GET: pesquisa de veículos de reboque disponíveis nas proximidades da origem indicada.
 * Retorna apenas condutores/camiões com disponibilidade activa, partilha de GPS activa
 * e localização válida e recente, sem serviço em curso nem pedido pendente por responder.
 */
export async function GET(req: NextRequest) {
  try {
    await exigirPapel("CLIENTE");

    const origemLat = parseFloat(req.nextUrl.searchParams.get("origemLat") || "");
    const origemLng = parseFloat(req.nextUrl.searchParams.get("origemLng") || "");
    const destinoLatRaw = req.nextUrl.searchParams.get("destinoLat");
    const destinoLngRaw = req.nextUrl.searchParams.get("destinoLng");
    const tipoVeiculo = req.nextUrl.searchParams.get("tipoVeiculo") || "LIGEIRO";
    const raioParam = parseFloat(
      req.nextUrl.searchParams.get("raioKm") || String(RAIO_PESQUISA_PADRAO_KM)
    );
    const raioKm = Number.isFinite(raioParam)
      ? Math.min(60, Math.max(5, raioParam))
      : RAIO_PESQUISA_PADRAO_KM;

    if (Number.isNaN(origemLat) || Number.isNaN(origemLng)) {
      return erro("Coordenadas de origem inválidas.", 422);
    }

    const origem: LatLng = { lat: origemLat, lng: origemLng };
    if (!estaNaMatola(origem)) {
      return erro(
        "Serviço disponível apenas na Matola e Zimpeto. O local indicado está fora dos limites.",
        422
      );
    }

    let destino: LatLng | null = null;
    if (destinoLatRaw && destinoLngRaw) {
      const dLat = parseFloat(destinoLatRaw);
      const dLng = parseFloat(destinoLngRaw);
      if (Number.isFinite(dLat) && Number.isFinite(dLng)) {
        destino = { lat: dLat, lng: dLng };
      }
    }
    const distanciaServicoKm = destino
      ? Math.round(haversineKm(origem, destino) * 100) / 100
      : null;

    const limiteExpiracao = new Date(Date.now() - EXPIRACAO_PEDIDO_MS);

    const [camioes, pedidosBloqueantes] = await Promise.all([
      prisma.camiao.findMany({
        where: {
          activo: true,
          disponivel: true,
          partilhaLocalizacao: true,
          motoristaId: { not: null },
          empresa: {
            estadoAprovacao: "APROVADA",
            consentimentoEm: { not: null },
          },
        },
        include: {
          motorista: { select: { id: true, nome: true, activo: true, empresaCondutorId: true } },
          empresa: {
            include: {
              precos: { where: { tipoVeiculo } },
              pedidos: {
                where: { avaliacao: { isNot: null } },
                select: { avaliacao: { select: { estrelas: true } } },
              },
            },
          },
        },
      }),
      prisma.pedido.findMany({
        where: {
          camiaoId: { not: null },
          OR: [
            { estado: { in: [...ESTADOS_EM_CURSO] } },
            { estado: "PENDENTE", criadoEm: { gte: limiteExpiracao } },
          ],
        },
        select: { camiaoId: true },
      }),
    ]);

    const ocupados = new Set(
      pedidosBloqueantes.map((p) => p.camiaoId).filter((id): id is string => Boolean(id))
    );

    const candidatos = camioes
      .filter((c) => {
        if (ocupados.has(c.id)) return false;
        if (!c.motoristaId || !c.motorista || !c.motorista.activo) return false;
        if (c.motorista.empresaCondutorId && c.motorista.empresaCondutorId !== c.empresaId) {
          return false;
        }
        if (!localizacaoActualizada(c)) return false;
        const dist = haversineKm({ lat: c.lat, lng: c.lng }, origem);
        return Number.isFinite(dist) && dist <= raioKm;
      })
      .map((c) => {
        const distanciaLinhaRetaKm =
          Math.round(haversineKm({ lat: c.lat, lng: c.lng }, origem) * 100) / 100;
        const distRef = distanciaServicoKm ?? distanciaLinhaRetaKm;
        const faixa = escolherFaixaPreco(c.empresa.precos, distRef);
        const totalAvaliacoes = c.empresa.pedidos.length;
        const media =
          totalAvaliacoes > 0
            ? c.empresa.pedidos.reduce((s, p) => s + (p.avaliacao?.estrelas ?? 0), 0) /
              totalAvaliacoes
            : null;
        return {
          camiao: c,
          distanciaLinhaRetaKm,
          faixa,
          media,
          totalAvaliacoes,
        };
      });

    const veiculos: VeiculoDisponivel[] = await Promise.all(
      candidatos.map(async ({ camiao, distanciaLinhaRetaKm, faixa, media, totalAvaliacoes }) => {
        const rota = await calcularRotaOSRM({ lat: camiao.lat, lng: camiao.lng }, origem);
        const bairro =
          camiao.empresa.endereco.split(",").slice(-2, -1)[0]?.trim() ||
          camiao.empresa.endereco;

        return {
          camiaoId: camiao.id,
          matricula: camiao.matricula,
          tipoCamiao: camiao.tipo,
          capacidade: camiao.capacidade,
          motoristaNome: camiao.motorista?.nome ?? camiao.motoristaNome,
          lat: camiao.lat,
          lng: camiao.lng,
          localizacaoActualizadaEm:
            camiao.localizacaoActualizadaEm instanceof Date
              ? camiao.localizacaoActualizadaEm.toISOString()
              : String(camiao.localizacaoActualizadaEm ?? ""),
          empresaId: camiao.empresa.id,
          empresaNome: camiao.empresa.nome,
          empresaBairro: bairro,
          media: media !== null ? Math.round(media * 10) / 10 : null,
          totalAvaliacoes,
          precoMin: faixa ? faixa.precoMin : null,
          precoMax: faixa ? faixa.precoMax : null,
          distanciaLinhaRetaKm,
          distanciaEstradaKm: rota.distanciaEstradaKm,
          tempoEstimadoMin: rota.tempoEstimadoMin,
          fonteRota: rota.fonteRota,
          distanciaServicoKm,
        };
      })
    );

    veiculos.sort((a, b) => {
      const da = a.tempoEstimadoMin ?? a.distanciaLinhaRetaKm * 3;
      const db = b.tempoEstimadoMin ?? b.distanciaLinhaRetaKm * 3;
      if (da !== db) return da - db;
      return a.distanciaLinhaRetaKm - b.distanciaLinhaRetaKm;
    });

    return ok({ veiculos, raioKm });
  } catch (e) {
    return tratarErroApi(e);
  }
}

/**
 * POST: cria uma solicitação dirigida a um veículo/condutor disponível específico.
 * O estado inicial é PENDENTE até o condutor seleccionado aceitar ou recusar.
 */
export async function POST(req: NextRequest) {
  try {
    const sessao = await exigirPapel("CLIENTE");
    const dados = schemaLocalizacao.parse(await req.json());

    const origem: LatLng = { lat: dados.origemLat, lng: dados.origemLng };
    if (!estaNaMatola(origem)) {
      return erro(
        "O local da avaria está fora dos limites de cobertura (Matola e Zimpeto). O serviço só está disponível nessa zona.",
        422
      );
    }

    let destino: LatLng | null = null;
    if (typeof dados.destinoLat === "number" && typeof dados.destinoLng === "number") {
      destino = { lat: dados.destinoLat, lng: dados.destinoLng };
      if (!estaNaMatola(destino)) {
        return erro(
          "O destino escolhido está fora dos limites de cobertura (Matola e Zimpeto). Escolha um destino nessa zona.",
          422
        );
      }
    }

    // Máximo de 1 pedido activo (PENDENTE ou em execução) por cliente.
    // Pedidos com estado RECUSADO ou CANCELADO não impedem nova tentativa.
    const activo = await prisma.pedido.findFirst({
      where: {
        condutorId: sessao.id,
        estado: { in: [...ESTADOS_ACTIVOS] },
      },
    });
    if (activo) {
      return erro(
        "Já tem um pedido em curso. Acompanhe-o ou cancele antes de criar outro.",
        409
      );
    }

    const camiao = await prisma.camiao.findUnique({
      where: { id: dados.camiaoId },
      include: {
        motorista: { select: { id: true, nome: true, activo: true, empresaCondutorId: true } },
        empresa: {
          include: {
            precos: { where: { tipoVeiculo: dados.tipoVeiculo } },
          },
        },
      },
    });

    const condutorDaMesmaEmpresa =
      camiao?.motorista &&
      (!camiao.motorista.empresaCondutorId ||
        camiao.motorista.empresaCondutorId === camiao.empresaId);

    if (
      !camiao ||
      !camiao.activo ||
      !camiao.disponivel ||
      !camiao.motoristaId ||
      !camiao.motorista?.activo ||
      !condutorDaMesmaEmpresa ||
      !localizacaoActualizada(camiao) ||
      camiao.empresa.estadoAprovacao !== "APROVADA" ||
      !camiao.empresa.consentimentoEm
    ) {
      return erro(
        "O veículo seleccionado deixou de estar disponível. Por favor actualize a pesquisa e escolha outra opção.",
        409
      );
    }

    if (dados.empresaId && camiao.empresaId !== dados.empresaId) {
      return erro("O veículo seleccionado não corresponde à empresa indicada.", 422);
    }

    const limiteExpiracao = new Date(Date.now() - EXPIRACAO_PEDIDO_MS);
    const pedidoNoCamiao = await prisma.pedido.findFirst({
      where: {
        camiaoId: camiao.id,
        OR: [
          { estado: { in: [...ESTADOS_EM_CURSO] } },
          { estado: "PENDENTE", criadoEm: { gte: limiteExpiracao } },
        ],
      },
    });
    if (pedidoNoCamiao) {
      return erro(
        "Este veículo acabou de receber outra solicitação ou está em serviço. Escolha outra opção disponível.",
        409
      );
    }

    const distanciaKm = destino
      ? Math.round(haversineKm(origem, destino) * 100) / 100
      : coordenadasValidas({ lat: camiao.lat, lng: camiao.lng })
        ? Math.round(haversineKm({ lat: camiao.lat, lng: camiao.lng }, origem) * 100) / 100
        : 0;

    const faixa = escolherFaixaPreco(camiao.empresa.precos, distanciaKm);
    if (!faixa) {
      return erro(
        "A empresa seleccionada não tem tabela de preços configurada para este tipo de veículo.",
        422
      );
    }

    const pedido = await prisma.pedido.create({
      data: {
        condutorId: sessao.id,
        empresaId: camiao.empresaId,
        camiaoId: camiao.id,
        veiculoId: null,
        origemLat: dados.origemLat,
        origemLng: dados.origemLng,
        origemEndereco: dados.origemEndereco,
        destinoLat: destino ? destino.lat : null,
        destinoLng: destino ? destino.lng : null,
        destinoEndereco: destino ? dados.destinoEndereco || null : null,
        distanciaKm,
        tipoProblema: dados.tipoProblema,
        tipoVeiculo: dados.tipoVeiculo,
        observacoes: dados.observacoes || null,
        estado: "PENDENTE",
        precoMin: faixa.precoMin,
        precoMax: faixa.precoMax,
        eventos: {
          create: {
            estado: "PENDENTE",
            nota: `Solicitação enviada para ${camiao.empresa.nome} (${camiao.matricula})`,
          },
        },
      },
    });

    return ok(
      {
        id: pedido.id,
        precoMin: pedido.precoMin,
        precoMax: pedido.precoMax,
      },
      201
    );
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
