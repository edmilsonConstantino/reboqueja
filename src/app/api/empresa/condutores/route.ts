import { prisma } from "@/lib/prisma";
import { exigirPapel, hashSenha } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
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
      where: { papel: "CONDUTOR", camiao: { empresaId: empresa.id } },
      orderBy: { criadoEm: "desc" },
      select: {
        id: true,
        nome: true,
        telefone: true,
        activo: true,
        criadoEm: true,
        camiao: { select: { id: true, matricula: true } },
      },
    });
    return ok({ condutores });
  } catch (e) {
    return tratarErroApi(e);
  }
}

/** POST: a empresa cria a conta de acesso de um condutor e liga-a a um camião. */
export async function POST(req: NextRequest) {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const empresa = await empresaDaSessao(sessao.id);
    if (!empresa) return erro("Empresa não encontrada.", 404);

    const dados = schemaContaCondutor.parse(await req.json());

    const camiao = await prisma.camiao.findUnique({ where: { id: dados.camiaoId } });
    if (!camiao || camiao.empresaId !== empresa.id) {
      return erro("Escolha um camião da sua empresa.", 422);
    }
    if (camiao.motoristaId) {
      return erro("Este camião já tem uma conta de condutor associada.", 409);
    }

    const jaExiste = await prisma.utilizador.findUnique({
      where: { telefone: dados.telefone },
    });
    if (jaExiste) {
      return erro("Já existe uma conta com este número de telefone.", 409);
    }

    const condutor = await prisma.utilizador.create({
      data: {
        nome: dados.nome,
        telefone: dados.telefone,
        senhaHash: await hashSenha(dados.senha),
        papel: "CONDUTOR",
        camiao: { connect: { id: camiao.id } },
      },
    });

    // Mantém os dados de contacto do camião em sincronia com a conta.
    await prisma.camiao.update({
      where: { id: camiao.id },
      data: { motoristaNome: dados.nome, motoristaTelefone: dados.telefone },
    });

    return ok({ id: condutor.id, telefone: condutor.telefone }, 201);
  } catch (e) {
    return tratarErroApi(e);
  }
}

/** DELETE: retira o acesso do condutor (conta desactivada, camião fica livre). */
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
    if (!condutor || condutor.camiao?.empresaId !== empresa.id) {
      return erro("Condutor não encontrado.", 404);
    }

    await prisma.$transaction([
      prisma.camiao.update({
        where: { id: condutor.camiao!.id },
        data: { motoristaId: null },
      }),
      prisma.utilizador.update({
        where: { id: condutor.id },
        data: { activo: false },
      }),
    ]);

    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
