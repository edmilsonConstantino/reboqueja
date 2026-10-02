import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/auth";
import { ok, tratarErroApi } from "@/lib/api";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await exigirPapel("ADMIN");

    const csv = req.nextUrl.searchParams.get("csv") === "1";
    const respostas = await prisma.respostaPrototipo.findMany({
      include: { utilizador: { select: { nome: true, papel: true } } },
      orderBy: { criadoEm: "desc" },
    });

    if (csv) {
      const linhas = [
        [
          "data", "nome", "papel", "sus",
          "sus1","sus2","sus3","sus4","sus5","sus6","sus7","sus8","sus9","sus10",
          "extra1","extra2","extra3","comentario",
        ].join(";"),
        ...respostas.map((r) => {
          const dados = JSON.parse(r.respostas) as {
            sus: number[]; extras: number[]; comentario?: string;
          };
          return [
            new Date(r.criadoEm).toISOString(),
            r.utilizador.nome,
            r.papel,
            r.susScore,
            ...dados.sus,
            ...dados.extras,
            `"${(dados.comentario || "").replace(/"/g, '""')}"`,
          ].join(";");
        }),
      ];
      const corpo = linhas.join("\n");
      return new Response(`\uFEFF${corpo}`, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="avaliacoes-prototipo.csv"`,
        },
      });
    }

    return ok({ respostas });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
