import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { NaoAutorizado, Proibido } from "@/lib/auth";

export function erro(mensagem: unknown, status = 400) {
  return NextResponse.json({ erro: mensagem }, { status });
}

export function ok<T>(dados: T, status = 200) {
  return NextResponse.json(dados, { status });
}

export function tratarErroApi(e: unknown) {
  if (e instanceof NaoAutorizado)
    return erro("Sessão expirada. Entre novamente.", 401);
  if (e instanceof Proibido) return erro("Sem permissão para esta acção.", 403);
  if (e instanceof ZodError) {
    const primeira = e.errors[0];
    return erro(
      `${primeira.path.join(".") || "campo"}: ${primeira.message}`,
      422
    );
  }
  console.error(e);
  return erro("Erro inesperado do servidor.", 500);
}

export async function corpo<T>(req: Request, schema: { parse: (d: unknown) => T }): Promise<T> {
  const json = await req.json().catch(() => {
    throw new Error("Corpo da pedido inválido.");
  });
  return schema.parse(json);
}
