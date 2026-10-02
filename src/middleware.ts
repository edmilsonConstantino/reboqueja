import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_SESSAO = process.env.AUTH_COOKIE_NAME || "rj_session";
const secreto = new TextEncoder().encode(
  process.env.AUTH_SECRET || "reboqueja-dev-secret-mude-me"
);

/** Prefixo → papéis permitidos. */
const REGRAS: { prefixo: string; papeis: string[] }[] = [
  { prefixo: "/app", papeis: ["CONDUTOR"] },
  { prefixo: "/empresa", papeis: ["EMPRESA"] },
  { prefixo: "/admin", papeis: ["ADMIN"] },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const regra = REGRAS.find((r) => pathname === r.prefixo || pathname.startsWith(r.prefixo + "/"));
  if (!regra) return NextResponse.next();

  const token = req.cookies.get(COOKIE_SESSAO)?.value;
  const paraLogin = (proximo: string) => {
    const url = new URL("/entrar", req.url);
    url.searchParams.set("proximo", proximo);
    return NextResponse.redirect(url);
  };
  const paraInicio = () => NextResponse.redirect(new URL("/", req.url));

  if (!token) return paraLogin(pathname);
  try {
    const { payload } = await jwtVerify(token, secreto);
    const papel = String(payload.papel);
    const activo = payload.activo !== false;
    if (!activo) return paraLogin(pathname);
    if (!regra.papeis.includes(papel)) return paraInicio();
    return NextResponse.next();
  } catch {
    return paraLogin(pathname);
  }
}

export const config = {
  matcher: ["/app/:path*", "/empresa/:path*", "/admin/:path*"],
};
