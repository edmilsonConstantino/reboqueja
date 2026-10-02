import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, tratarErroApi } from "@/lib/api";
import { schemaDisponivel } from "@/lib/validations";
import type { NextRequest } from "next/server";

/** GET: dados do painel da empresa (novos, em curso, números do dia). */
export async function GET() {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const empresa = await prisma.empresa.findUnique({
      where: { utilizadorId: sessao.id },
    });
    if (!empresa) return ok({ empresa: null });

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const [novos, emCurso, concluidosHoje, canceladosHoje, ganhosHoje] =
      await Promise.all([
        prisma.pedido.findMany({
          where: { estado: "PENDENTE" },
          orderBy: { criadoEm: "desc" },
          include: {
            condutor: { select: { nome: true, telefone: true } },
            veiculo: true,
          },
        }),
        prisma.pedido.findMany({
          where: {
            empresaId: empresa.id,
            estado: { in: ["ACEITE", "A_CAMINHO", "NO_LOCAL", "EM_TRANSPORTE"] },
          },
          orderBy: { actualizadoEm: "desc" },
          include: {
            condutor: { select: { nome: true, telefone: true } },
            camiao: true,
          },
        }),
        prisma.pedido.count({
          where: {
            empresaId: empresa.id,
            estado: "CONCLUIDO",
            actualizadoEm: { gte: hoje },
          },
        }),
        prisma.pedido.count({
          where: {
            empresaId: empresa.id,
            estado: "CANCELADO",
            actualizadoEm: { gte: hoje },
          },
        }),
        prisma.pedido.aggregate({
          where: {
            empresaId: empresa.id,
            estado: "CONCLUIDO",
            actualizadoEm: { gte: hoje },
          },
          _sum: { precoMin: true, precoMax: true },
        }),
      ]);

    const avaliacoes = await prisma.avaliacao.findMany({
      where: { pedido: { empresaId: empresa.id } },
      select: { estrelas: true },
    });
    const media =
      avaliacoes.length > 0
        ? avaliacoes.reduce((s, a) => s + a.estrelas, 0) / avaliacoes.length
        : null;

    return ok({
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        disponivel: empresa.disponivel,
        estadoAprovacao: empresa.estadoAprovacao,
        camioesActivos: await prisma.camiao.count({
          where: { empresaId: empresa.id, activo: true },
        }),
        media,
        totalAvaliacoes: avaliacoes.length,
      },
      novos: novos.map((p) => ({
        id: p.id,
        criadoEm: p.criadoEm,
        origemEndereco: p.origemEndereco,
        destinoEndereco: p.destinoEndereco,
        distanciaKm: p.distanciaKm,
        tipoProblema: p.tipoProblema,
        tipoVeiculo: p.tipoVeiculo,
        precoMin: p.precoMin,
        precoMax: p.precoMax,
        condutorNome: p.condutor.nome,
        veiculo: p.veiculo
          ? `${p.veiculo.marca} ${p.veiculo.modelo} · ${p.veiculo.matricula}`
          : null,
      })),
      emCurso: emCurso.map((p) => ({
        id: p.id,
        estado: p.estado,
        origemEndereco: p.origemEndereco,
        destinoEndereco: p.destinoEndereco,
        condutorNome: p.condutor.nome,
        condutorTelefone: p.condutor.telefone,
        camiaoMatricula: p.camiao?.matricula,
      })),
      hoje: {
        concluidos: concluidosHoje,
        cancelados: canceladosHoje,
        ganhoMin: ganhosHoje._sum.precoMin || 0,
        ganhoMax: ganhosHoje._sum.precoMax || 0,
      },
    });
  } catch (e) {
    return tratarErroApi(e);
  }
}

/** PATCH: alternar disponível/indisponível. */
export async function PATCH(req: NextRequest) {
  try {
    const sessao = await exigirPapel("EMPRESA");
    const { disponivel } = schemaDisponivel.parse(await req.json());
    const empresa = await prisma.empresa.update({
      where: { utilizadorId: sessao.id },
      data: { disponivel },
    });
    return ok({ disponivel: empresa.disponivel });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
