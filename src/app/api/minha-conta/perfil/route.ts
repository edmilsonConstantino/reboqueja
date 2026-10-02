import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, tratarErroApi } from "@/lib/api";
import { schemaPerfilCondutor } from "@/lib/validations";
import type { NextRequest } from "next/server";

export async function GET() {
  try {
    const sessao = await exigirPapel("CONDUTOR");
    const utilizador = await prisma.utilizador.findUnique({
      where: { id: sessao.id },
      select: {
        id: true,
        nome: true,
        telefone: true,
        veiculos: true,
      },
    });
    return ok({ utilizador });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessao = await exigirPapel("CONDUTOR");
    const dados = schemaPerfilCondutor.parse(await req.json());

    await prisma.utilizador.update({
      where: { id: sessao.id },
      data: { nome: dados.nome },
    });

    // Sincroniza veículos: remove os que saíram, actualiza/insere os restantes
    const actuais = await prisma.veiculo.findMany({
      where: { condutorId: sessao.id },
    });
    const idsEnviados = dados.veiculos.filter((v) => v.id).map((v) => v.id!);
    for (const antigo of actuais) {
      if (!idsEnviados.includes(antigo.id)) {
        await prisma.veiculo.delete({ where: { id: antigo.id } });
      }
    }
    for (const v of dados.veiculos) {
      if (v.id && actuais.some((a) => a.id === v.id)) {
        await prisma.veiculo.update({
          where: { id: v.id },
          data: { marca: v.marca, modelo: v.modelo, matricula: v.matricula, tipo: v.tipo },
        });
      } else {
        await prisma.veiculo.create({
          data: {
            condutorId: sessao.id,
            marca: v.marca,
            modelo: v.modelo,
            matricula: v.matricula,
            tipo: v.tipo,
          },
        });
      }
    }

    return ok({ sucesso: true });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
