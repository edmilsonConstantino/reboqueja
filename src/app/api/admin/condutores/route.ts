import { prisma } from "@/lib/prisma";
import { exigirPapel, hashSenha } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { schemaAdminCriarCondutor } from "@/lib/validations";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await exigirPapel("ADMIN");
    const empresaId = req.nextUrl.searchParams.get("empresaId") || "";

    const condutores = await prisma.utilizador.findMany({
      where: {
        papel: "CONDUTOR",
        ...(empresaId
          ? {
              OR: [
                { empresaCondutorId: empresaId },
                { camiao: { empresaId } },
              ],
            }
          : {}),
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
        empresaCondutor: { select: { id: true, nome: true } },
        camiao: {
          select: { id: true, matricula: true, marca: true, modelo: true, empresaId: true },
        },
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

export async function POST(req: NextRequest) {
  try {
    await exigirPapel("ADMIN");
    const dados = schemaAdminCriarCondutor.parse(await req.json());

    const empresa = await prisma.empresa.findUnique({
      where: { id: dados.empresaId },
      select: { id: true, nome: true },
    });
    if (!empresa) {
      return erro("Empresa não encontrada.", 404);
    }

    const existeTelefone = await prisma.utilizador.findUnique({
      where: { telefone: dados.telefone },
      select: { id: true },
    });
    if (existeTelefone) {
      return erro("Já existe uma conta registada com este número de telefone.", 409);
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

    const condutor = await prisma.utilizador.create({
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

    return ok(
      {
        condutor: {
          ...condutor,
          empresaCondutor: empresa,
          camiao: null,
          disponivelParaAtribuir: true,
        },
      },
      201
    );
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
