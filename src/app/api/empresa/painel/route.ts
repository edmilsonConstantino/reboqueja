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
    const inicioSemana = new Date(hoje.getTime() - 6 * 24 * 60 * 60 * 1000);

    const [novos, emCurso, concluidosHoje, canceladosHoje, ganhosHoje, pedidosRecentes, camioes] =
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
        prisma.pedido.findMany({
          where: { empresaId: empresa.id, criadoEm: { gte: inicioSemana } },
          select: {
            estado: true,
            criadoEm: true,
            actualizadoEm: true,
            precoMin: true,
            precoMax: true,
          },
        }),
        prisma.camiao.findMany({
          where: { empresaId: empresa.id },
          orderBy: { matricula: "asc" },
          select: {
            id: true,
            matricula: true,
            tipo: true,
            capacidade: true,
            motoristaNome: true,
            activo: true,
            _count: { select: { pedidos: { where: { estado: { in: ["ACEITE", "A_CAMINHO", "NO_LOCAL", "EM_TRANSPORTE"] } } } } },
          },
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

    // ---- Atividade da semana: concluídos e cancelados por dia (seg→dom) ----
    const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const porDia = new Map<string, { concluidos: number; cancelados: number; ganhoMin: number; ganhoMax: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoje.getTime() - i * 24 * 60 * 60 * 1000);
      porDia.set(d.toISOString().slice(0, 10), { concluidos: 0, cancelados: 0, ganhoMin: 0, ganhoMax: 0 });
    }
    let tempoMedioRespostaMin: number | null = null;
    const tempos: number[] = [];
    for (const p of pedidosRecentes) {
      const chave = p.criadoEm.toISOString().slice(0, 10);
      const acc = porDia.get(chave);
      if (acc) {
        if (p.estado === "CONCLUIDO") {
          acc.concluidos += 1;
          acc.ganhoMin += p.precoMin;
          acc.ganhoMax += p.precoMax;
        } else if (p.estado === "CANCELADO") {
          acc.cancelados += 1;
        }
      }
    }
    // Tempo médio de resposta (PENDENTE→ACEITE) via eventos dos pedidos da semana
    const eventosSemana = await prisma.pedidoEvento.findMany({
      where: {
        estado: { in: ["PENDENTE", "ACEITE"] },
        pedido: { empresaId: empresa.id, criadoEm: { gte: inicioSemana } },
      },
      select: { pedidoId: true, estado: true, criadoEm: true },
      orderBy: { criadoEm: "asc" },
    });
    const primeiroEvento = new Map<string, Record<string, Date>>();
    for (const ev of eventosSemana) {
      const reg = primeiroEvento.get(ev.pedidoId) || {};
      if (!reg[ev.estado]) reg[ev.estado] = ev.criadoEm;
      primeiroEvento.set(ev.pedidoId, reg);
    }
    for (const reg of primeiroEvento.values()) {
      if (reg.PENDENTE && reg.ACEITE) {
        tempos.push((reg.ACEITE.getTime() - reg.PENDENTE.getTime()) / 60000);
      }
    }
    tempoMedioRespostaMin = tempos.length
      ? tempos.reduce((s, t) => s + t, 0) / tempos.length
      : null;

    const hojeChave = new Date().toISOString().slice(0, 10);
    const accHoje = porDia.get(hojeChave);
    const resumoHoje = {
      receitaMin: accHoje?.ganhoMin ?? 0,
      receitaMax: accHoje?.ganhoMax ?? 0,
      concluidos: concluidosHoje,
      tempoRespostaMin: tempoMedioRespostaMin,
    };

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
      resumoHoje: {
        receitaMin: resumoHoje.receitaMin,
        receitaMax: resumoHoje.receitaMax,
        concluidos: resumoHoje.concluidos,
        tempoRespostaMin: resumoHoje.tempoRespostaMin,
      },
      semana: Array.from(porDia.entries()).map(([dia, v]) => ({
        dia: DIAS_SEMANA[new Date(dia + "T12:00:00").getDay()],
        dataIso: dia,
        concluidos: v.concluidos,
        cancelados: v.cancelados,
      })),
      camioes: camioes.map((c) => ({
        id: c.id,
        matricula: c.matricula,
        tipo: c.tipo,
        motoristaNome: c.motoristaNome,
        activo: c.activo,
        emServico: c._count.pedidos > 0,
      })),
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
