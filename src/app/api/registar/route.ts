import { prisma } from "@/lib/prisma";
import { definirCookieSessao, hashSenha, Papel } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { schemaRegistarCondutor } from "@/lib/validations";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const dados = schemaRegistarCondutor.parse(await req.json());
    const telefone = dados.telefone;

    const existente = await prisma.utilizador.findUnique({
      where: { telefone },
    });
    if (existente) {
      return erro("Já existe uma conta com este telefone.", 409);
    }

    const utilizador = await prisma.utilizador.create({
      data: {
        nome: dados.nome,
        telefone,
        senhaHash: await hashSenha(dados.senha),
        papel: "CONDUTOR",
      },
    });

    await definirCookieSessao({
      id: utilizador.id,
      nome: utilizador.nome,
      telefone: utilizador.telefone,
      papel: "CONDUTOR" as Papel,
    });

    return ok({ id: utilizador.id, papel: "CONDUTOR" }, 201);
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
