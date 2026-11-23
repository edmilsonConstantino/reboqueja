import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, erro, ErroApi, tratarErroApi } from "@/lib/api";
import { schemaAdminCriarCamiao } from "@/lib/validations";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const sessao = await exigirPapel("ADMIN");
    const dados = schemaAdminCriarCamiao.parse(await req.json());

    const empresa = await prisma.empresa.findUnique({
      where: { id: dados.empresaId },
      select: { id: true, nome: true },
    });
    if (!empresa) {
      return erro("Empresa não encontrada.", 404);
    }

    const matricula = dados.matricula.trim().toUpperCase();
    const existente = await prisma.camiao.findFirst({
      where: { matricula },
      select: { id: true, empresaId: true },
    });
    if (existente) {
      return erro(`Já existe um camião registado com a matrícula ${matricula}.`, 409);
    }

    const criado = await prisma.$transaction(async (tx) => {
      let motorista: {
        id: string;
        nome: string;
        telefone: string;
        papel: string;
        activo: boolean;
        empresaCondutorId: string | null;
        camiao: { id: string; matricula: string; empresaId: string } | null;
      } | null = null;

      if (dados.motoristaId) {
        motorista = await tx.utilizador.findUnique({
          where: { id: dados.motoristaId },
          select: {
            id: true,
            nome: true,
            telefone: true,
            papel: true,
            activo: true,
            empresaCondutorId: true,
            camiao: { select: { id: true, matricula: true, empresaId: true } },
          },
        });
        if (!motorista) {
          throw new ErroApi("Condutor seleccionado não encontrado.", 404);
        }
        if (motorista.papel !== "CONDUTOR") {
          throw new ErroApi("O utilizador seleccionado não tem perfil de condutor.", 422);
        }
        if (!motorista.activo) {
          throw new ErroApi("Não é possível atribuir um condutor inactivo.", 422);
        }
        const empCondutor = motorista.empresaCondutorId ?? motorista.camiao?.empresaId ?? null;
        if (!empCondutor || empCondutor !== empresa.id) {
          throw new ErroApi("O condutor deve pertencer à mesma empresa do camião.", 422);
        }
        if (motorista.camiao) {
          throw new ErroApi(
            `Este condutor já está associado ao camião ${motorista.camiao.matricula}.`,
            409
          );
        }
      }

      const camiao = await tx.camiao.create({
        data: {
          empresaId: empresa.id,
          matricula,
          marca: dados.marca.trim(),
          modelo: dados.modelo.trim(),
          tipo: dados.tipo,
          capacidade: dados.capacidade?.trim() || null,
          activo: dados.activo ?? true,
          motoristaId: motorista ? motorista.id : null,
          motoristaNome: motorista ? motorista.nome : "",
          motoristaTelefone: motorista ? motorista.telefone : "",
          // Registo ou atribuição administrativa nunca activa automaticamente a disponibilidade
          disponivel: false,
          partilhaLocalizacao: false,
          localizacaoActualizadaEm: null,
          lat: 0,
          lng: 0,
        },
      });

      if (motorista) {
        if (!motorista.empresaCondutorId) {
          await tx.utilizador.update({
            where: { id: motorista.id },
            data: { empresaCondutorId: empresa.id },
          });
        }
        await tx.atribuicaoCamiao.create({
          data: {
            camiaoId: camiao.id,
            motoristaId: motorista.id,
            atribuidoPorId: sessao.id,
            inicioEm: new Date(),
            fimEm: null,
            motivo: dados.motivo?.trim() || "Atribuição inicial no registo do camião",
          },
        });
      }

      return camiao;
    });

    return ok({ id: criado.id, matricula: criado.matricula }, 201);
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
