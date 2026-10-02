import { prisma } from "@/lib/prisma";
import {
  definirCookieSessao,
  verificarSenha,
  Papel,
} from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { schemaEntrar } from "@/lib/validations";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { contacto, senha } = schemaEntrar.parse(await req.json());
    const c = contacto.trim().toLowerCase();

    const utilizador = await prisma.utilizador.findFirst({
      where: {
        OR: [{ telefone: contacto.trim() }, { email: c }],
      },
    });

    if (!utilizador || !(await verificarSenha(senha, utilizador.senhaHash))) {
      return erro("Telefone/email ou palavra-passe incorrectos.", 401);
    }
    if (!utilizador.activo) {
      return erro(
        "A sua conta está desactivada. Contacte o administrador.",
        403
      );
    }

    await definirCookieSessao({
      id: utilizador.id,
      nome: utilizador.nome,
      telefone: utilizador.telefone,
      papel: utilizador.papel as Papel,
    });

    return ok({
      papel: utilizador.papel,
      nome: utilizador.nome,
    });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
