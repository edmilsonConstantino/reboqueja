export const TIPOS_PROBLEMA = [
  { value: "AVARIA_MECANICA", label: "Avaria mecânica" },
  { value: "ACIDENTE", label: "Acidente" },
  { value: "PNEU_FURADO", label: "Pneu furado" },
  { value: "SEM_COMBUSTIVEL", label: "Sem combustível" },
  { value: "BATERIA", label: "Bateria" },
  { value: "OUTRO", label: "Outro" },
] as const;

export const TIPOS_VEICULO = [
  { value: "LIGEIRO", label: "Ligeiro" },
  { value: "SUV", label: "SUV/Pick-up" },
  { value: "MINIBUS", label: "Mini-bus" },
  { value: "PESADO", label: "Pesado" },
] as const;

export const ESTADOS_PEDIDO = [
  "PENDENTE",
  "ACEITE",
  "A_CAMINHO",
  "NO_LOCAL",
  "EM_TRANSPORTE",
  "CONCLUIDO",
  "CANCELADO",
] as const;

export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export const LABEL_ESTADO: Record<string, string> = {
  PENDENTE: "Pendente",
  ACEITE: "Aceite",
  A_CAMINHO: "A caminho",
  NO_LOCAL: "No local",
  EM_TRANSPORTE: "Em transporte",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

/** Próximo estado no fluxo da empresa. */
export const PROXIMO_ESTADO: Record<string, string> = {
  ACEITE: "A_CAMINHO",
  A_CAMINHO: "NO_LOCAL",
  NO_LOCAL: "EM_TRANSPORTE",
  EM_TRANSPORTE: "CONCLUIDO",
};

export const METODOS_PAGAMENTO = [
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "MPESA", label: "M-Pesa" },
  { value: "EMOLA", label: "e-Mola" },
] as const;

export const INTERVALOS_KM = [
  { kmMin: 0, kmMax: 5, label: "0 – 5 km" },
  { kmMin: 5, kmMax: 10, label: "5 – 10 km" },
  { kmMin: 10, kmMax: 20, label: "10 – 20 km" },
  { kmMin: 20, kmMax: 9999, label: "Mais de 20 km" },
] as const;

export const BAIRROS_MATOLA = [
  "Machava",
  "Matola Gare",
  "Matola Rio",
  "Fomento",
  "Liberdade",
  "T3",
  "Infulene",
  "Sungo",
  "Marrote",
  "Muanono",
  "1.º de Maio",
  "Matola A",
  "Matola B",
  "Matola C",
  "Zimpeto",
] as const;

export const CENTRO_MATOLA = { lat: -25.962, lng: 32.459 };

export const VELOCIDADE_MEDIA_KMH = 30;

export const EXPIRACAO_PEDIDO_MS = 3 * 60 * 1000; // 3 minutos
