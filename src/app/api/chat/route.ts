import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { obterSessao } from "@/lib/auth";
import { BAIRROS_MATOLA } from "@/lib/constants";

export const dynamic = "force-dynamic";

const schemaChat = z.object({
  mensagens: z
    .array(
      z.object({
        papel: z.enum(["user", "assistant"]),
        conteudo: z.string().trim().min(1).max(1500),
      })
    )
    .min(1, "Envie pelo menos uma mensagem.")
    .max(20),
  rota: z.string().trim().max(120).optional(),
});

async function construirContextoSistema(rota?: string, papelUtilizador?: string | null) {
  let resumoEmpresas = "";
  try {
    const empresas = await prisma.empresa.findMany({
      where: { estadoAprovacao: "APROVADA" },
      include: {
        precos: { where: { tipoVeiculo: "LIGEIRO" }, orderBy: { kmMin: "asc" } },
        camioes: { where: { activo: true }, select: { id: true, disponivel: true } },
      },
    });
    if (empresas.length > 0) {
      resumoEmpresas = empresas
        .map((e) => {
          const base = e.precos[0];
          const precoBase = base ? `${base.precoMin}–${base.precoMax} MT (0–5 km ligeiro)` : "sob consulta";
          const online = e.camioes.filter((c) => c.disponivel).length;
          return `- ${e.nome} (${e.endereco}): ${e.camioes.length} camiões (${online} online), tarifa base ${precoBase}`;
        })
        .join("\n");
    }
  } catch {
    resumoEmpresas = "- Empresas credenciadas na Cidade da Matola e Zimpeto.";
  }

  return [
    "És o Assistente Inteligente da plataforma ReboqueJá, na Cidade da Matola e Zimpeto, Moçambique.",
    "Responde sempre em português claro, empático, objectivo e útil (português de Moçambique/Portugal).",
    "Ajuda condutores, empresas de reboque e operadores com dúvidas em tempo real sobre:",
    "1. Escolha do tipo de veículo ao pedir reboque: Ligeiro (carros comuns/sedan/hatchback), SUV/Pick-up (4x4, Hilux, carrinhas médias), Mini-bus (carrinhas de passageiros/hiace), Pesado (camiões/máquinas) ou a opção 'Outro' — que permite escrever livremente qualquer detalhe do veículo caso o cliente não tenha certeza da categoria.",
    "2. Como pedir reboque: confirmar localização GPS ou no mapa, escolher tipo de problema e veículo (ou 'Outro' com descrição), comparar empresas próximas por tempo estimado/preço e confirmar solicitação.",
    "3. Segurança imediata na via: ligar os 4 piscas, colocar o triângulo de sinalização a distância segura e aguardar em local visível e fora da faixa de rodagem.",
    "4. Pagamentos aceites após o serviço: Dinheiro, M-Pesa e e-Mola, com faixa de preço transparente estimada antes de confirmar.",
    `Bairros principais de cobertura: ${BAIRROS_MATOLA.join(", ")}.`,
    resumoEmpresas ? `Empresas activas na plataforma:\n${resumoEmpresas}` : "",
    papelUtilizador ? `Papel actual do utilizador autenticado: ${papelUtilizador}.` : "",
    rota ? `Página actual do utilizador: ${rota}.` : "",
    "Não inventes números de telefone pessoais nem prometas preços fixos fora da faixa apresentada pela plataforma.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function chamarOpenRouter(
  apiKey: string,
  modelo: string,
  mensagens: { role: "system" | "user" | "assistant"; content: string }[]
) {
  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "ReboqueJá Matola",
    },
    body: JSON.stringify({
      model: modelo,
      stream: true,
      temperature: 0.4,
      max_tokens: 650,
      messages: mensagens,
    }),
  });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      { erro: "Serviço de chat indisponível: defina OPENROUTER_API_KEY no ambiente do servidor." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ erro: "Pedido JSON inválido." }, { status: 400 });
  }

  const parsed = schemaChat.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { erro: parsed.error.issues[0]?.message || "Dados do chat inválidos." },
      { status: 422 }
    );
  }

  const sessao = await obterSessao().catch(() => null);
  const sistema = await construirContextoSistema(parsed.data.rota, sessao?.papel ?? null);

  const historico: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: sistema },
    ...parsed.data.mensagens.map((m) => ({
      role: m.papel as "user" | "assistant",
      content: m.conteudo,
    })),
  ];

  const modeloPrincipal = process.env.OPENROUTER_MODEL?.trim() || "openrouter/auto";
  let upstream = await chamarOpenRouter(apiKey, modeloPrincipal, historico);

  if (!upstream.ok && modeloPrincipal !== "openrouter/free") {
    upstream = await chamarOpenRouter(apiKey, "openrouter/free", historico);
  }

  if (!upstream.ok || !upstream.body) {
    const detalhe = await upstream.text().catch(() => "");
    return Response.json(
      {
        erro: "Não foi possível obter resposta do assistente neste momento.",
        detalhe: detalhe.slice(0, 180) || undefined,
      },
      { status: 502 }
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const linhas = buffer.split("\n");
          buffer = linhas.pop() ?? "";

          for (const linhaRaw of linhas) {
            const linha = linhaRaw.trim();
            if (!linha || !linha.startsWith("data:")) continue;
            const payload = linha.slice(5).trim();
            if (payload === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(payload) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const delta = json.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta.length > 0) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
              }
            } catch {
              // Ignora keepalives ou chunks parciais
            }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (e) {
        controller.error(e);
      } finally {
        reader.releaseLock();
      }
    },
    cancel() {
      void reader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
