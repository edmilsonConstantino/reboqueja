import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, erro, ErroApi, tratarErroApi } from "@/lib/api";
import { estadoOperacionalCamiao } from "@/lib/camioes";
import { ESTADOS_EM_CURSO, localizacaoActualizada } from "@/lib/condutor";
import { EXPIRACAO_PEDIDO_MS } from "@/lib/constants";
import { coordenadasValidas } from "@/lib/geo";
import { schemaCamiao } from "@/lib/validations";
import type { NextRequest } from "next/server";

async function empresaDaSessao(sessaoId: string) {
  return prisma.empresa.findUnique({
    where: { utilizadorId: sessaoId },
    select: { id: true, nome: true, estadoAprovacao: true, consentimentoEm: true },
  });
}

async function empresaId(sessaoId: string) {
  const empresa = await empresaDaSessao(sessaoId);
  return empresa?.id ?? null;
}

export async function GET() {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const empresa = await empresaDaSessao(sessao.id);
    if (!empresa) return ok({ empresa: null, camioes: [] });

    const limiteExpiracao = new Date(Date.now() - EXPIRACAO_PEDIDO_MS);
    const camioes = await prisma.camiao.findMany({
      where: { empresaId: empresa.id },
      orderBy: { matricula: "asc" },
      include: {
        motorista: { select: { id: true, nome: true, telefone: true, email: true, activo: true } },
        _count: { select: { atribuicoes: true } },
        pedidos: {
          orderBy: { criadoEm: "desc" },
          include: {
            condutor: { select: { nome: true } },
          },
        },
      },
    });

    const enriquecidos = camioes.map((c) => {
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
          empresa,
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
        motoristaNome: c.motoristaNome,
        motoristaTelefone: c.motoristaTelefone,
        activo: c.activo,
        disponivel: Boolean(c.disponivel),
        localizacaoValida: locValida,
        gpsActivo,
        localizacaoActualizadaEm: c.localizacaoActualizadaEm ?? null,
        estadoDisponibilidade,
        totalAtribuicoes: c._count?.atribuicoes ?? 0,
        pedidoActivo: pedidoActivo
          ? {
              id: pedidoActivo.id,
              estado: pedidoActivo.estado,
              clienteNome: pedidoActivo.condutor.nome,
            }
          : null,
        motorista: c.motorista,
      };
    });

    return ok({
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        estadoAprovacao: empresa.estadoAprovacao,
      },
      camioes: enriquecidos,
    });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const id = await empresaId(sessao.id);
    if (!id) return erro("Empresa não encontrada.", 404);

    const dados = schemaCamiao.parse(await req.json());
    const matricula = dados.matricula.trim().toUpperCase();
    const duplicada = await prisma.camiao.findFirst({
      where: { matricula },
      select: { id: true },
    });
    if (duplicada) {
      return erro(`Já existe um camião com a matrícula ${matricula}.`, 409);
    }

    const criado = await prisma.$transaction(async (tx) => {
      let motorista: {
        id: string;
        nome: string;
        telefone: string;
        papel: string;
        activo: boolean;
        empresaCondutorId: string | null;
        camiao: { id: string; matricula: string; empresaId: string } | null;
      } | null = null;

      if (dados.motoristaId) {
        motorista = await tx.utilizador.findUnique({
          where: { id: dados.motoristaId },
          select: {
            id: true,
            nome: true,
            telefone: true,
            papel: true,
            activo: true,
            empresaCondutorId: true,
            camiao: { select: { id: true, matricula: true, empresaId: true } },
          },
        });
        if (!motorista) {
          throw new ErroApi("Condutor seleccionado não encontrado.", 404);
        }
        if (motorista.papel !== "CONDUTOR") {
          throw new ErroApi("O utilizador seleccionado não tem perfil de condutor.", 422);
        }
        if (!motorista.activo) {
          throw new ErroApi("Não é possível atribuir um condutor inactivo.", 422);
        }
        const empCondutor = motorista.empresaCondutorId ?? motorista.camiao?.empresaId ?? null;
        if (!empCondutor || empCondutor !== id) {
          throw new ErroApi("O condutor deve pertencer à mesma empresa do camião.", 422);
        }
        if (motorista.camiao) {
          throw new ErroApi(
            `Este condutor já está associado ao camião ${motorista.camiao.matricula}.`,
            409
          );
        }
      }

      const camiao = await tx.camiao.create({
        data: {
          empresaId: id,
          matricula,
          marca: dados.marca?.trim() || null,
          modelo: dados.modelo?.trim() || null,
          tipo: dados.tipo,
          capacidade: dados.capacidade?.trim() || null,
          motoristaId: motorista ? motorista.id : null,
          motoristaNome: motorista ? motorista.nome : dados.motoristaNome || "",
          motoristaTelefone: motorista ? motorista.telefone : dados.motoristaTelefone || "",
          activo: dados.activo ?? true,
          lat: 0,
          lng: 0,
          disponivel: false,
          partilhaLocalizacao: false,
          localizacaoActualizadaEm: null,
        },
      });

      if (motorista) {
        if (!motorista.empresaCondutorId) {
          await tx.utilizador.update({
            where: { id: motorista.id },
            data: { empresaCondutorId: id },
          });
        }
        await tx.atribuicaoCamiao.create({
          data: {
            camiaoId: camiao.id,
            motoristaId: motorista.id,
            atribuidoPorId: sessao.id,
            inicioEm: new Date(),
            fimEm: null,
            motivo: dados.motivo?.trim() || "Atribuição inicial no registo do camião",
          },
        });
      }

      return camiao;
    });

    return ok({ id: criado.id, matricula: criado.matricula }, 201);
  } catch (e) {
    return tratarErroApi(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const id = await empresaId(sessao.id);
    if (!id) return erro("Empresa não encontrada.", 404);

    const { id: camiaoId, ...dados } = (await req.json()) as {
      id: string;
    } & Record<string, unknown>;
    const parsed = schemaCamiao.partial().parse(dados);

    const camiao = await prisma.camiao.findUnique({ where: { id: camiaoId } });
    if (!camiao || camiao.empresaId !== id) return erro("Camião não encontrado.", 404);

    if (parsed.matricula) {
      const normalizada = parsed.matricula.trim().toUpperCase();
      const duplicada = await prisma.camiao.findFirst({
        where: { matricula: normalizada, id: { not: camiaoId } },
        select: { id: true },
      });
      if (duplicada) {
        return erro(`Já existe outro camião com a matrícula ${normalizada}.`, 409);
      }
    }

    if (parsed.activo === false) {
      const pedidoActivo = await prisma.pedido.findFirst({
        where: {
          camiaoId,
          OR: [
            { estado: { in: [...ESTADOS_EM_CURSO] } },
            { estado: "PENDENTE", criadoEm: { gte: new Date(Date.now() - EXPIRACAO_PEDIDO_MS) } },
          ],
        },
        select: { id: true },
      });
      if (pedidoActivo) {
        return erro(
          "Não é possível desactivar um camião com serviço em curso ou solicitação pendente.",
          409
        );
      }
    }

    await prisma.camiao.update({
      where: { id: camiaoId },
      data: {
        ...parsed,
        matricula: parsed.matricula?.trim().toUpperCase(),
        marca: parsed.marca !== undefined ? parsed.marca?.trim() || null : undefined,
        modelo: parsed.modelo !== undefined ? parsed.modelo?.trim() || null : undefined,
        capacidade: parsed.capacidade !== undefined ? parsed.capacidade?.trim() || null : undefined,
        ...(parsed.activo === false ? { disponivel: false, partilhaLocalizacao: false } : {}),
      },
    });
    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const id = await empresaId(sessao.id);
    if (!id) return erro("Empresa não encontrada.", 404);

    const camiaoId = req.nextUrl.searchParams.get("id");
    if (!camiaoId) return erro("Indique o camião.", 422);

    const camiao = await prisma.camiao.findUnique({ where: { id: camiaoId } });
    if (!camiao || camiao.empresaId !== id) return erro("Camião não encontrado.", 404);

    const pedidoActivo = await prisma.pedido.findFirst({
      where: {
        camiaoId,
        OR: [
          { estado: { in: [...ESTADOS_EM_CURSO] } },
          { estado: "PENDENTE", criadoEm: { gte: new Date(Date.now() - EXPIRACAO_PEDIDO_MS) } },
        ],
      },
      select: { id: true },
    });
    if (pedidoActivo) {
      return erro(
        "Não é possível eliminar um camião com serviço em curso ou solicitação pendente.",
        409
      );
    }

    await prisma.camiao.delete({ where: { id: camiaoId } });
    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
