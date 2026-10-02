import { prisma } from "@/lib/prisma";
import { definirCookieSessao, hashSenha } from "@/lib/auth";
import { ok, erro, tratarErroApi } from "@/lib/api";
import { schemaRegistarEmpresa } from "@/lib/validations";
import { BAIRROS_MATOLA } from "@/lib/constants";
import type { NextRequest } from "next/server";

/** Coordenadas aproximadas dos bairros da Matola (para colocar a empresa no mapa). */
const CENTROS_BAIRROS: Record<string, { lat: number; lng: number }> = {
  Machava: { lat: -25.955, lng: 32.46 },
  "Matola Rio": { lat: -25.99, lng: 32.47 },
  Liberdade: { lat: -25.97, lng: 32.49 },
  T3: { lat: -25.965, lng: 32.44 },
  Fomento: { lat: -25.95, lng: 32.48 },
  "Matola Gare": { lat: -26.01, lng: 32.46 },
  Infulene: { lat: -25.93, lng: 32.51 },
  Sungo: { lat: -26.0, lng: 32.5 },
  Marrote: { lat: -25.98, lng: 32.43 },
  Muanono: { lat: -25.975, lng: 32.47 },
  "1.º de Maio": { lat: -25.96, lng: 32.45 },
  "Matola A": { lat: -25.965, lng: 32.455 },
  "Matola B": { lat: -25.968, lng: 32.462 },
  "Matola C": { lat: -25.97, lng: 32.468 },
  Zimpeto: { lat: -25.92, lng: 32.45 },
};

export async function POST(req: NextRequest) {
  try {
    const dados = schemaRegistarEmpresa.parse(await req.json());

    const existente = await prisma.utilizador.findUnique({
      where: { telefone: dados.telefone },
    });
    if (existente) {
      return erro("Já existe uma conta com este telefone.", 409);
    }
    const emailExiste = await prisma.utilizador.findUnique({
      where: { email: dados.email.toLowerCase() },
    });
    if (emailExiste) {
      return erro("Já existe uma conta com este email.", 409);
    }

    const centro =
      CENTROS_BAIRROS[dados.bairro] || CENTROS_BAIRROS["Machava"];

    const utilizador = await prisma.utilizador.create({
      data: {
        nome: dados.nome,
        telefone: dados.telefone,
        email: dados.email.toLowerCase(),
        senhaHash: await hashSenha(dados.senha),
        papel: "EMPRESA",
        empresa: {
          create: {
            nome: dados.nome,
            nuit: dados.nuit,
            telefone: dados.telefone,
            email: dados.email.toLowerCase(),
            endereco: `${dados.endereco}, ${dados.bairro}`,
            lat: centro.lat,
            lng: centro.lng,
            raioKm: 15,
            disponivel: false,
            estadoAprovacao: "PENDENTE",
            consentimentoEm: new Date(),
          },
        },
        // Faixas de preço iniciais para o tipo Ligeiro — editáveis depois em /empresa/precos
      },
    });

    const empresa = await prisma.empresa.findUnique({
      where: { utilizadorId: utilizador.id },
    });
    if (empresa) {
      await prisma.faixaPreco.createMany({
        data: [
          { empresaId: empresa.id, tipoVeiculo: "LIGEIRO", kmMin: 0, kmMax: 5, precoMin: 500, precoMax: 1000 },
          { empresaId: empresa.id, tipoVeiculo: "LIGEIRO", kmMin: 5, kmMax: 10, precoMin: 1000, precoMax: 2000 },
          { empresaId: empresa.id, tipoVeiculo: "LIGEIRO", kmMin: 10, kmMax: 20, precoMin: 2000, precoMax: 3500 },
          { empresaId: empresa.id, tipoVeiculo: "LIGEIRO", kmMin: 20, kmMax: 9999, precoMin: 3500, precoMax: 5000 },
        ],
      });
    }

    await definirCookieSessao({
      id: utilizador.id,
      nome: utilizador.nome,
      telefone: utilizador.telefone,
      papel: "EMPRESA",
    });

    return ok({ id: utilizador.id, papel: "EMPRESA" }, 201);
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
