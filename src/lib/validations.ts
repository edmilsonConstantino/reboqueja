import { z } from "zod";

const telefoneRegex = /^(\+?258)?\s?8[2-7]\d{7}$/;

export const schemaTelefone = z
  .string()
  .transform((v) => v.replace(/[^\d+]/g, ""))
  .refine((v) => telefoneRegex.test(v.replace(/\s/g, "")), {
    message: "Use um número moçambicano (ex.: +258 84 123 4567).",
  });

export const schemaEntrar = z.object({
  contacto: z.string().min(3, "Indique o telefone ou email."),
  senha: z.string().min(4, "A palavra-passe deve ter pelo menos 4 caracteres."),
});

export const schemaRegistarCondutor = z.object({
  nome: z.string().min(3, "Indique o nome completo."),
  telefone: schemaTelefone,
  senha: z.string().min(4, "A palavra-passe deve ter pelo menos 4 caracteres."),
});

export const schemaRegistarEmpresa = z.object({
  nome: z.string().min(3, "Indique o nome da empresa."),
  nuit: z
    .string()
    .regex(/^\d{9}$/, "O NUIT deve ter 9 dígitos."),
  telefone: schemaTelefone,
  email: z.string().email("Email inválido."),
  endereco: z.string().min(5, "Indique o endereço."),
  bairro: z.string().min(2, "Escolha o bairro de operação."),
  senha: z.string().min(4, "A palavra-passe deve ter pelo menos 4 caracteres."),
  consentimento: z.literal(true, {
    errorMap: () => ({ message: "É necessário aceitar os termos de publicação." }),
  }),
});

export const schemaCoordenada = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const schemaLocalizacao = z.object({
  origemLat: z.number(),
  origemLng: z.number(),
  origemEndereco: z.string().min(2, "Confirme o endereço da avaria."),
  destinoLat: z.number(),
  destinoLng: z.number(),
  destinoEndereco: z.string().min(2, "Escolha o destino."),
  tipoProblema: z.enum([
    "AVARIA_MECANICA",
    "ACIDENTE",
    "PNEU_FURADO",
    "SEM_COMBUSTIVEL",
    "BATERIA",
    "OUTRO",
  ]),
  tipoVeiculo: z.enum(["LIGEIRO", "SUV", "MINIBUS", "PESADO"]),
  observacoes: z.string().max(500).optional().nullable(),
});

export const schemaAceitarPedido = z.object({
  empresaId: z.string().min(1).optional(), // derivado da sessão no servidor
  camiaoId: z.string().min(1),
});

export const schemaEstado = z.object({
  estado: z.enum([
    "A_CAMINHO",
    "NO_LOCAL",
    "EM_TRANSPORTE",
    "CONCLUIDO",
    "CANCELADO",
  ]),
  camiaoId: z.string().min(1).optional(),
  canceladoPor: z.string().optional(),
});

export const schemaConcluir = z.object({
  metodoPagamento: z.enum(["DINHEIRO", "MPESA", "EMOLA"]),
  estrelas: z.number().int().min(1).max(5),
  comentario: z.string().max(500).optional().nullable(),
});

export const schemaCamiao = z.object({
  matricula: z.string().min(4, "Matrícula inválida."),
  tipo: z.enum(["LIGEIRO", "SUV", "MINIBUS", "PESADO"]),
  capacidade: z.string().optional().nullable(),
  motoristaNome: z.string().min(3, "Indique o nome do motorista."),
  motoristaTelefone: schemaTelefone,
  activo: z.boolean().optional(),
});

export const schemaFaixaPreco = z
  .object({
    tipoVeiculo: z.enum(["LIGEIRO", "SUV", "MINIBUS", "PESADO"]),
    kmMin: z.number().min(0),
    kmMax: z.number().min(1),
    precoMin: z.number().int().min(100, "O mínimo é 100 MT."),
    precoMax: z.number().int().max(20000),
  })
  .refine((d) => d.kmMax > d.kmMin, {
    message: "O km máximo deve ser maior que o mínimo.",
    path: ["kmMax"],
  })
  .refine((d) => d.precoMax > d.precoMin, {
    message: "O preço máximo deve ser maior que o mínimo.",
    path: ["precoMax"],
  });

export const schemaPerfilCondutor = z.object({
  nome: z.string().min(3),
  veiculos: z
    .array(
      z.object({
        id: z.string().optional(),
        marca: z.string().min(2),
        modelo: z.string().min(1),
        matricula: z.string().min(4),
        tipo: z.enum(["LIGEIRO", "SUV", "MINIBUS", "PESADO"]),
      })
    )
    .max(5),
});

export const schemaDisponivel = z.object({
  disponivel: z.boolean(),
});

export const schemaLocalizacaoCamiao = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const schemaRespostaPrototipo = z.object({
  sus: z.array(z.number().int().min(1).max(5)).length(10),
  extras: z.array(z.number().int().min(1).max(5)).length(3),
  comentario: z.string().max(1000).optional().nullable(),
});

export const schemaAprovarEmpresa = z.object({
  decisao: z.enum(["APROVADA", "REJEITADA"]),
  motivo: z.string().max(300).optional().nullable(),
});

export const schemaUtilizadorActivo = z.object({
  activo: z.boolean(),
});
