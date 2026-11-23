import { prisma } from "@/lib/prisma";
import { exigirPapel, hashSenha } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { ESTADOS_EM_CURSO } from "@/lib/condutor";
import { schemaContaCondutor } from "@/lib/validations";
import type { NextRequest } from "next/server";

async function empresaDaSessao(sessaoId: string) {
  return prisma.empresa.findUnique({ where: { utilizadorId: sessaoId } });
}

/** GET: contas de condutor da empresa. */
export async function GET() {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const empresa = await empresaDaSessao(sessao.id);
    if (!empresa) return ok({ condutores: [] });

    const condutores = await prisma.utilizador.findMany({
      where: {
        papel: "CONDUTOR",
        OR: [{ empresaCondutorId: empresa.id }, { camiao: { empresaId: empresa.id } }],
      },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        telefone: true,
        email: true,
        activo: true,
        criadoEm: true,
        empresaCondutorId: true,
        camiao: { select: { id: true, matricula: true } },
      },
    });
    return ok({
      condutores: condutores.map((c) => ({
        ...c,
        disponivelParaAtribuir: Boolean(c.activo && !c.camiao),
      })),
    });
  } catch (e) {
    return tratarErroApi(e);
  }
}

/** POST: a empresa cria a conta de acesso de um condutor (com ou sem associação imediata a um camião). */
export async function POST(req: NextRequest) {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const empresa = await empresaDaSessao(sessao.id);
    if (!empresa) return erro("Empresa não encontrada.", 404);

    const dados = schemaContaCondutor.parse(await req.json());

    let camiao: { id: string; empresaId: string; matricula: string; motoristaId: string | null } | null = null;
    if (dados.camiaoId) {
      camiao = await prisma.camiao.findUnique({
        where: { id: dados.camiaoId },
        select: { id: true, empresaId: true, matricula: true, motoristaId: true },
      });
      if (!camiao || camiao.empresaId !== empresa.id) {
        return erro("Escolha um camião da sua empresa.", 422);
      }
      if (camiao.motoristaId) {
        return erro("Este camião já tem uma conta de condutor associada.", 409);
      }
    }

    const jaExiste = await prisma.utilizador.findUnique({
      where: { telefone: dados.telefone },
      select: { id: true },
    });
    if (jaExiste) {
      return erro("Já existe uma conta com este número de telefone.", 409);
    }

    if (dados.email) {
      const existeEmail = await prisma.utilizador.findUnique({
        where: { email: dados.email },
        select: { id: true },
      });
      if (existeEmail) {
        return erro("Já existe uma conta registada com este email.", 409);
      }
    }

    const agora = new Date();
    const condutor = await prisma.$transaction(async (tx) => {
      const criado = await tx.utilizador.create({
        data: {
          nome: dados.nome,
          telefone: dados.telefone,
          email: dados.email ?? null,
          senhaHash: await hashSenha(dados.senha),
          papel: "CONDUTOR",
          activo: true,
          empresaCondutorId: empresa.id,
        },
        select: {
          id: true,
          nome: true,
          telefone: true,
          email: true,
          activo: true,
          criadoEm: true,
          empresaCondutorId: true,
        },
      });

      if (camiao) {
        await tx.camiao.update({
          where: { id: camiao.id },
          data: {
            motoristaId: criado.id,
            motoristaNome: dados.nome,
            motoristaTelefone: dados.telefone,
            disponivel: false,
            partilhaLocalizacao: false,
            localizacaoActualizadaEm: null,
            lat: 0,
            lng: 0,
          },
        });

        await tx.atribuicaoCamiao.create({
          data: {
            camiaoId: camiao.id,
            motoristaId: criado.id,
            atribuidoPorId: sessao.id,
            inicioEm: agora,
            fimEm: null,
            motivo: "Atribuição pela empresa",
          },
        });
      }

      return criado;
    });

    return ok(
      {
        id: condutor.id,
        telefone: condutor.telefone,
        condutor: {
          ...condutor,
          camiao: camiao ? { id: camiao.id, matricula: camiao.matricula } : null,
          disponivelParaAtribuir: !camiao,
        },
      },
      201
    );
  } catch (e) {
    return tratarErroApi(e);
  }
}

/** DELETE: retira o acesso do condutor (conta desactivada, camião fica livre e histórico fechado). */
export async function DELETE(req: NextRequest) {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const empresa = await empresaDaSessao(sessao.id);
    if (!empresa) return erro("Empresa não encontrada.", 404);

    const motoristaId = req.nextUrl.searchParams.get("id");
    if (!motoristaId) return erro("Indique o condutor.", 422);

    const condutor = await prisma.utilizador.findUnique({
      where: { id: motoristaId },
      include: { camiao: { select: { id: true, empresaId: true } } },
    });
    if (
      !condutor ||
      (condutor.empresaCondutorId !== empresa.id &&
        condutor.camiao?.empresaId !== empresa.id)
    ) {
      return erro("Condutor não encontrado.", 404);
    }

    if (condutor.camiao) {
      const emCurso = await prisma.pedido.findFirst({
        where: { camiaoId: condutor.camiao.id, estado: { in: [...ESTADOS_EM_CURSO] } },
        select: { id: true },
      });
      if (emCurso) {
        return erro(
          "Não é possível remover o acesso enquanto o condutor executa um serviço em curso.",
          409
        );
      }
    }

    const agora = new Date();
    await prisma.$transaction(async (tx) => {
      if (condutor.camiao) {
        await tx.atribuicaoCamiao.updateMany({
          where: { camiaoId: condutor.camiao.id, fimEm: null },
          data: { fimEm: agora },
        });
        await tx.camiao.update({
          where: { id: condutor.camiao.id },
          data: {
            motoristaId: null,
            motoristaNome: "",
            motoristaTelefone: "",
            disponivel: false,
            partilhaLocalizacao: false,
            localizacaoActualizadaEm: null,
            lat: 0,
            lng: 0,
          },
        });
      }
      await tx.utilizador.update({
        where: { id: condutor.id },
        data: { activo: false },
      });
    });

    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
