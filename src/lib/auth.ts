import "server-only";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const secreto = new TextEncoder().encode(
  process.env.AUTH_SECRET || "reboqueja-dev-secret-mude-me"
);

export const COOKIE_SESSAO = process.env.AUTH_COOKIE_NAME || "rj_session";

export type Papel = "CONDUTOR" | "EMPRESA" | "ADMIN";

export type Sessao = {
  id: string;
  nome: string;
  telefone: string;
  papel: Papel;
};

export class NaoAutorizado extends Error {}
export class Proibido extends Error {}

export async function criarToken(sessao: Sessao): Promise<string> {
  return new SignJWT({ ...sessao })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secreto);
}

export async function definirCookieSessao(sessao: Sessao) {
  const token = await criarToken(sessao);
  cookies().set(COOKIE_SESSAO, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function limparCookieSessao() {
  cookies().delete(COOKIE_SESSAO);
}

export async function obterSessao(): Promise<Sessao | null> {
  const token = cookies().get(COOKIE_SESSAO)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secreto);
    return {
      id: String(payload.id),
      nome: String(payload.nome),
      telefone: String(payload.telefone),
      papel: payload.papel as Papel,
    };
  } catch {
    return null;
  }
}

export async function exigirSessao(): Promise<Sessao> {
  const s = await obterSessao();
  if (!s) throw new NaoAutorizado();
  return s;
}

export async function exigirPapel(...papeis: Papel[]): Promise<Sessao> {
  const s = await exigirSessao();
  if (!papeis.includes(s.papel)) throw new Proibido();
  return s;
}

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

/** Sessão fresca da BD (para validar `activo` e papéis alterados). */
export async function utilizadorActual() {
  const s = await obterSessao();
  if (!s) return null;
  const u = await prisma.utilizador.findUnique({
    where: { id: s.id },
    select: { id: true, nome: true, telefone: true, papel: true, activo: true },
  });
  if (!u || !u.activo) return null;
  return u;
}
