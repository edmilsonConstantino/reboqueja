import { z } from "zod";

const telefoneRegex = /^(\+?258)?\s?8[2-7]\d{7}$/;

export function normalizarTelefone(valor: string): string {
  const limpo = valor.replace(/[^\d+]/g, "");
  if (/^8[2-7]\d{7}$/.test(limpo)) return `+258${limpo}`;
  if (/^2588[2-7]\d{7}$/.test(limpo)) return `+${limpo}`;
  return limpo;
}

export const schemaTelefone = z
  .string()
  .transform((v) => normalizarTelefone(v))
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

export const schemaLocalizacao = z
  .object({
    origemLat: z.number().min(-90).max(90),
    origemLng: z.number().min(-180).max(180),
    origemEndereco: z.string().min(2, "Confirme o endereço da avaria."),
    destinoLat: z.number().min(-90).max(90).nullable().optional(),
    destinoLng: z.number().min(-180).max(180).nullable().optional(),
    destinoEndereco: z.string().nullable().optional(),
    camiaoId: z.string().min(1, "Seleccione um veículo de reboque disponível."),
    empresaId: z.string().min(1).optional(),
    tipoProblema: z.enum([
      "AVARIA_MECANICA",
      "ACIDENTE",
      "PNEU_FURADO",
      "SEM_COMBUSTIVEL",
      "BATERIA",
      "OUTRO",
    ]),
    tipoVeiculo: z.enum(["LIGEIRO", "SUV", "MINIBUS", "PESADO", "OUTRO"]),
    detalhesVeiculo: z.string().trim().max(300).optional().nullable(),
    observacoes: z.string().max(500).optional().nullable(),
  })
  .refine(
    (d) =>
      (d.destinoLat == null && d.destinoLng == null) ||
      (typeof d.destinoLat === "number" && typeof d.destinoLng === "number"),
    { message: "Coordenadas de destino incompletas.", path: ["destinoLat"] }
  );

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
  matricula: z.string().trim().min(4, "Matrícula inválida."),
  marca: z.string().trim().max(60).optional().nullable(),
  modelo: z.string().trim().max(60).optional().nullable(),
  tipo: z.enum(["LIGEIRO", "SUV", "MINIBUS", "PESADO"]),
  capacidade: z.string().trim().max(60).optional().nullable(),
  motoristaNome: z
    .string()
    .trim()
    .optional()
    .transform((v) => v ?? "")
    .refine((v) => v.length === 0 || v.length >= 3, {
      message: "O nome do condutor deve ter pelo menos 3 caracteres.",
    }),
  motoristaTelefone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? normalizarTelefone(v) : ""))
    .refine((v) => v.length === 0 || telefoneRegex.test(v.replace(/\s/g, "")), {
      message: "Use um número moçambicano (ex.: +258 84 123 4567).",
    }),
  motoristaId: z.string().min(1).optional().nullable(),
  motivo: z.string().trim().max(240).optional().nullable(),
  activo: z.boolean().optional(),
});

export const schemaAdminCriarCamiao = z.object({
  empresaId: z.string().min(1, "Seleccione a empresa proprietária."),
  matricula: z.string().trim().min(4, "Indique uma matrícula válida."),
  marca: z.string().trim().min(2, "Indique a marca do camião.").max(60),
  modelo: z.string().trim().min(1, "Indique o modelo do camião.").max(60),
  tipo: z.enum(["LIGEIRO", "SUV", "MINIBUS", "PESADO"]),
  capacidade: z.string().trim().max(60).optional().nullable(),
  activo: z.boolean().optional().default(true),
  motoristaId: z.string().min(1).optional().nullable(),
  motivo: z.string().trim().max(240).optional().nullable(),
});

export const schemaAdminActualizarCamiao = z.object({
  matricula: z.string().trim().min(4, "Indique uma matrícula válida.").optional(),
  marca: z.string().trim().min(2, "Indique a marca do camião.").max(60).optional(),
  modelo: z.string().trim().min(1, "Indique o modelo do camião.").max(60).optional(),
  tipo: z.enum(["LIGEIRO", "SUV", "MINIBUS", "PESADO"]).optional(),
  capacidade: z.string().trim().max(60).optional().nullable(),
  activo: z.boolean().optional(),
  motoristaId: z.string().min(1).nullable().optional(),
  motivo: z.string().trim().max(240).optional().nullable(),
});

export const schemaAdminCriarCondutor = z.object({
  empresaId: z.string().min(1, "Seleccione a empresa do condutor."),
  nome: z.string().trim().min(3, "Indique o nome completo do condutor."),
  telefone: schemaTelefone,
  email: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "Email inválido.",
    }),
  senha: z
    .string()
    .min(4, "A palavra-passe deve ter pelo menos 4 caracteres.")
    .max(72),
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
        tipo: z.enum(["LIGEIRO", "SUV", "MINIBUS", "PESADO", "OUTRO"]),
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

/** Alteração da própria palavra-passe. */
export const schemaAlterarSenha = z.object({
  actual: z.string().min(1, "Indique a palavra-passe actual."),
  nova: z
    .string()
    .min(4, "A nova palavra-passe deve ter pelo menos 4 caracteres.")
    .max(72),
});

/** Conta de acesso do condutor, criada pela empresa. */
export const schemaContaCondutor = z.object({
  nome: z.string().trim().min(3, "Indique o nome do condutor."),
  telefone: schemaTelefone,
  email: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "Email inválido.",
    }),
  senha: z.string().min(4, "A palavra-passe deve ter pelo menos 4 caracteres.").max(72),
  camiaoId: z.string().min(1).optional().nullable(),
});

/** Condutor aceita um pedido pendente. */
export const schemaAceitarPedidoCondutor = z.object({
  pedidoId: z.string().min(1),
});

/** Condutor recusa um pedido pendente. */
export const schemaRecusarPedidoCondutor = z.object({
  pedidoId: z.string().min(1),
  motivo: z.string().max(300).optional().nullable(),
});

/** Condutor alterna disponibilidade para serviços (com coordenadas obrigatórias ao activar). */
export const schemaDisponibilidadeCondutor = z
  .object({
    disponivel: z.boolean(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  })
  .refine((d) => !d.disponivel || (typeof d.lat === "number" && typeof d.lng === "number"), {
    message: "É necessária uma localização válida para ficar disponível.",
    path: ["lat"],
  });

/** Actualização periódica da localização GPS do condutor. */
export const schemaLocalizacaoCondutor = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
