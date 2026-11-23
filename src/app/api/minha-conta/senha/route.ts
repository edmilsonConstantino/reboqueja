import { prisma } from "@/lib/prisma";
import { exigirSessao, hashSenha, verificarSenha } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { schemaAlterarSenha } from "@/lib/validations";
import type { NextRequest } from "next/server";

/** Alteração da própria palavra-passe (qualquer papel autenticado). */
export async function PATCH(req: NextRequest) {
  try {
    const sessao = await exigirSessao();
    const { actual, nova } = schemaAlterarSenha.parse(await req.json());

    const utilizador = await prisma.utilizador.findUnique({
      where: { id: sessao.id },
      select: { senhaHash: true },
    });
    if (!utilizador) return erro("Conta não encontrada.", 404);

    if (!(await verificarSenha(actual, utilizador.senhaHash))) {
      return erro("A palavra-passe actual está incorrecta.", 400);
    }

    await prisma.utilizador.update({
      where: { id: sessao.id },
      data: { senhaHash: await hashSenha(nova) },
    });

    return ok({ sucesso: true, mensagem: "Palavra-passe alterada com sucesso." });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
