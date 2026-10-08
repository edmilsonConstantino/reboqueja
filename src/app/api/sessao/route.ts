import { obterSessao } from "@/lib/auth";
import { ok } from "@/lib/api";

/** Sessão resumida para a navbar pública (sem dados sensíveis). */
export async function GET() {
  const sessao = await obterSessao();
  if (!sessao) return ok({ logado: false });
  return ok({ logado: true, nome: sessao.nome, papel: sessao.papel });
}

export const dynamic = "force-dynamic";
