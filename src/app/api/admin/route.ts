import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, tratarErroApi } from "@/lib/api";

const DIA_MS = 24 * 60 * 60 * 1000;
const JANELA = 30 * DIA_MS;

/** Chave do dia (YYYY-MM-DD) para agrupar séries. */
function chaveDia(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    await exigirPapel("ADMIN");

    const agora = new Date();
    const [
      porEstado,
      empresas,
      totalUtilizadores,
      mediaAvaliacoes,
      todosPedidos,
      eventos,
      avaliacoes,
    ] = await Promise.all([
      prisma.pedido.groupBy({ by: ["estado"], _count: true }),
      prisma.empresa.findMany({
        select: { estadoAprovacao: true, _count: { select: { pedidos: true } } },
      }),
      prisma.utilizador.count(),
      prisma.avaliacao.aggregate({ _avg: { estrelas: true }, _count: true }),
      prisma.pedido.findMany({
        select: { id: true, estado: true, criadoEm: true, origemEndereco: true },
      }),
      prisma.pedidoEvento.findMany({
        select: { pedidoId: true, estado: true, criadoEm: true },
        orderBy: { criadoEm: "asc" },
      }),
      prisma.avaliacao.findMany({
        select: { estrelas: true, pedido: { select: { criadoEm: true } } },
      }),
    ]);

    // ---- Tempos médios (em JS: SQLite guarda datas como inteiros ms) ----
    const primeiro = (pedidoId: string, estado: string) =>
      eventos.find((e) => e.pedidoId === pedidoId && e.estado === estado);
    const temposResposta: { dia: string; min: number }[] = [];
    const temposChegada: { dia: string; min: number }[] = [];
    const pedidosIds = Array.from(new Set(eventos.map((e) => e.pedidoId)));
    for (const id of pedidosIds) {
      const pen = primeiro(id, "PENDENTE");
      const ace = primeiro(id, "ACEITE");
      const nol = primeiro(id, "NO_LOCAL");
      if (pen && ace) {
        temposResposta.push({
          dia: chaveDia(pen.criadoEm),
          min: (ace.criadoEm.getTime() - pen.criadoEm.getTime()) / 60000,
        });
      }
      if (ace && nol) {
        temposChegada.push({
          dia: chaveDia(ace.criadoEm),
          min: (nol.criadoEm.getTime() - ace.criadoEm.getTime()) / 60000,
        });
      }
    }
    const media = (xs: number[]) =>
      xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
    const tempoMedioRespostaMin = media(temposResposta.map((t) => t.min));
    const tempoMedioChegadaMin = media(temposChegada.map((t) => t.min));

    // ---- Janelas de 30 dias (actual vs anterior) para variações ----
    const inicioActual = agora.getTime() - JANELA;
    const inicioAnterior = agora.getTime() - 2 * JANELA;
    const naJanela = (d: Date, de: number, ate: number) => {
      const t = d.getTime();
      return t >= de && t < ate;
    };
    const pedActual = todosPedidos.filter((p) =>
      naJanela(p.criadoEm, inicioActual, agora.getTime() + 1)
    ).length;
    const pedAnterior = todosPedidos.filter((p) =>
      naJanela(p.criadoEm, inicioAnterior, inicioActual)
    ).length;
    const avActual = avaliacoes.filter((a) =>
      naJanela(a.pedido.criadoEm, inicioActual, agora.getTime() + 1)
    );
    const avAnterior = avaliacoes.filter((a) =>
      naJanela(a.pedido.criadoEm, inicioAnterior, inicioActual)
    );
    const mediaActual = media(avActual.map((a) => a.estrelas));
    const mediaAnterior = media(avAnterior.map((a) => a.estrelas));
    const respActual = temposResposta.filter((t) => {
      const ev = eventos.find(
        (e) => e.estado === "PENDENTE" && chaveDia(e.criadoEm) === t.dia
      );
      return ev ? naJanela(ev.criadoEm, inicioActual, agora.getTime() + 1) : false;
    });
    const respAnterior = temposResposta.filter((t) => {
      const ev = eventos.find(
        (e) => e.estado === "PENDENTE" && chaveDia(e.criadoEm) === t.dia
      );
      return ev ? naJanela(ev.criadoEm, inicioAnterior, inicioActual) : false;
    });
    const cheActual = temposChegada.filter((t) => {
      const ev = eventos.find(
        (e) => e.estado === "ACEITE" && chaveDia(e.criadoEm) === t.dia
      );
      return ev ? naJanela(ev.criadoEm, inicioActual, agora.getTime() + 1) : false;
    });
    const cheAnterior = temposChegada.filter((t) => {
      const ev = eventos.find(
        (e) => e.estado === "ACEITE" && chaveDia(e.criadoEm) === t.dia
      );
      return ev ? naJanela(ev.criadoEm, inicioAnterior, inicioActual) : false;
    });

    /** Variação percentual; null se não comparável. */
    const variacao = (actual: number | null, anterior: number | null) => {
      if (actual === null || anterior === null || anterior === 0) return null;
      return ((actual - anterior) / anterior) * 100;
    };

    // ---- Séries diárias (últimos 14 dias) para os sparklines ----
    const DIAS = 14;
    const dias: string[] = [];
    for (let i = DIAS - 1; i >= 0; i--) {
      dias.push(chaveDia(new Date(agora.getTime() - i * DIA_MS)));
    }
    const pedidosPorDia = dias.map((dia) => ({
      dia,
      total: todosPedidos.filter((p) => chaveDia(p.criadoEm) === dia).length,
    }));
    const mediaDia = (lista: { dia: string; min: number }[], dia: string) =>
      media(lista.filter((t) => t.dia === dia).map((t) => t.min));
    let ultResposta: number | null = null;
    let ultChegada: number | null = null;
    const respostaPorDia = dias.map((dia) => {
      const m = mediaDia(temposResposta, dia);
      if (m !== null) ultResposta = m;
      return { dia, valor: m ?? ultResposta ?? 0 };
    });
    const chegadaPorDia = dias.map((dia) => {
      const m = mediaDia(temposChegada, dia);
      if (m !== null) ultChegada = m;
      return { dia, valor: m ?? ultChegada ?? 0 };
    });
    let ultAv: number | null = null;
    const avaliacoesPorDia = dias.map((dia) => {
      const doDia = avaliacoes
        .filter((a) => chaveDia(a.pedido.criadoEm) === dia)
        .map((a) => a.estrelas);
      const m = media(doDia);
      if (m !== null) ultAv = m;
      return { dia, valor: m ?? ultAv ?? 0 };
    });

    // ---- Bairros: heurística sobre o endereço de origem ----
    const contarBairros: Record<string, number> = {};
    const BAIRROS = [
      "Machava", "Matola Rio", "Liberdade", "T3", "Fomento", "Matola Gare",
      "Infulene", "Sungo", "Marrote", "Muanono", "1.º de Maio",
      "Matola A", "Matola B", "Matola C", "Zimpeto",
    ];
    for (const p of todosPedidos) {
      const end = p.origemEndereco.toLowerCase();
      const bairro = BAIRROS.find((b) => end.includes(b.toLowerCase()));
      contarBairros[bairro || "Outros"] = (contarBairros[bairro || "Outros"] || 0) + 1;
    }

    // ---- Últimos pedidos (tabela do dashboard) ----
    const ultimos = await prisma.pedido.findMany({
      orderBy: { criadoEm: "desc" },
      take: 5,
      select: {
        id: true,
        estado: true,
        criadoEm: true,
        origemEndereco: true,
        condutor: { select: { nome: true } },
      },
    });

    const emp = (estado: string) =>
      empresas.filter((e) => e.estadoAprovacao === estado).length;

    return ok({
      pedidosPorEstado: porEstado,
      empresas: {
        aprovadas: emp("APROVADA"),
        pendentes: emp("PENDENTE"),
        rejeitadas: emp("REJEITADA"),
      },
      totalUtilizadores,
      mediaAvaliacoes: mediaAvaliacoes._avg.estrelas,
      totalAvaliacoes: mediaAvaliacoes._count,
      tempoMedioRespostaMin,
      tempoMedioChegadaMin,
      pedidosPorBairro: Object.entries(contarBairros)
        .map(([bairro, total]) => ({ bairro, total }))
        .sort((a, b) => b.total - a.total),
      variacoes: {
        pedidos: variacao(pedActual, pedAnterior),
        avaliacao:
          mediaActual !== null && mediaAnterior !== null
            ? mediaActual - mediaAnterior
            : null,
        resposta: variacao(
          respActual.length ? media(respActual.map((t) => t.min)) : null,
          respAnterior.length ? media(respAnterior.map((t) => t.min)) : null
        ),
        chegada: variacao(
          cheActual.length ? media(cheActual.map((t) => t.min)) : null,
          cheAnterior.length ? media(cheAnterior.map((t) => t.min)) : null
        ),
      },
      series: { pedidosPorDia, avaliacoesPorDia, respostaPorDia, chegadaPorDia },
      ultimosPedidos: ultimos.map((p) => ({
        id: p.id,
        estado: p.estado,
        criadoEm: p.criadoEm,
        cliente: p.condutor.nome,
        bairro:
          BAIRROS.find((b) => p.origemEndereco.toLowerCase().includes(b.toLowerCase())) ||
          "Matola",
      })),
    });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
