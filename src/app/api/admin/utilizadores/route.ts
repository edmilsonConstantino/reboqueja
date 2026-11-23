import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { ESTADOS_EM_CURSO } from "@/lib/condutor";
import { schemaUtilizadorActivo } from "@/lib/validations";
import type { NextRequest } from "next/server";

export async function GET() {
  try {
    await exigirPapel("ADMIN");
    const utilizadores = await prisma.utilizador.findMany({
      select: {
        id: true,
        nome: true,
        telefone: true,
        email: true,
        papel: true,
        activo: true,
        criadoEm: true,
        _count: { select: { pedidos: true } },
        // Empresa do utilizador (papel EMPRESA) e, para condutores, o camião e
        // a empresa a que está afecto — permite filtrar por empresa no painel.
        empresa: { select: { id: true, nome: true } },
        empresaCondutor: { select: { id: true, nome: true } },
        camiao: {
          select: {
            matricula: true,
            empresa: { select: { id: true, nome: true } },
          },
        },
      },
      orderBy: { criadoEm: "desc" },
    });
    return ok({ utilizadores });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessao = await exigirPapel("ADMIN");
    const { id, ...resto } = (await req.json()) as { id: string } & Record<string, unknown>;
    const { activo } = schemaUtilizadorActivo.parse(resto);

    if (id === sessao.id) {
      return erro("Não pode desactivar a sua própria conta.", 409);
    }

    if (!activo) {
      const camiaoDoCondutor = await prisma.camiao.findFirst({
        where: { motoristaId: id },
        select: { id: true },
      });
      if (camiaoDoCondutor) {
        const emCurso = await prisma.pedido.findFirst({
          where: { camiaoId: camiaoDoCondutor.id, estado: { in: [...ESTADOS_EM_CURSO] } },
          select: { id: true },
        });
        if (emCurso) {
          return erro(
            "Não é possível desactivar este condutor enquanto executa um serviço em curso.",
            409
          );
        }
      }
    }

    await prisma.utilizador.update({ where: { id }, data: { activo } });
    if (!activo) {
      await prisma.camiao.updateMany({
        where: { motoristaId: id },
        data: { disponivel: false, partilhaLocalizacao: false },
      });
    }
    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
