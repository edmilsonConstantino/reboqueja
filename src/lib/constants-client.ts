/** Mapas de rótulos partilhados entre servidor e cliente (sem hooks). */

export const LABEL_VEICULO: Record<string, string> = {
  LIGEIRO: "Ligeiro",
  SUV: "SUV/Pick-up",
  MINIBUS: "Mini-bus",
  PESADO: "Pesado",
};

export const LABEL_PROBLEMA: Record<string, string> = {
  AVARIA_MECANICA: "Avaria mecânica",
  ACIDENTE: "Acidente",
  PNEU_FURADO: "Pneu furado",
  SEM_COMBUSTIVEL: "Sem combustível",
  BATERIA: "Bateria",
  OUTRO: "Outro",
};

export const LABEL_PAGAMENTO: Record<string, string> = {
  DINHEIRO: "Dinheiro",
  MPESA: "M-Pesa",
  EMOLA: "e-Mola",
};

export const LABEL_ESTADO: Record<string, string> = {
  PENDENTE: "Pendente",
  ACEITE: "Aceite",
  A_CAMINHO: "A caminho",
  NO_LOCAL: "No local",
  EM_TRANSPORTE: "Em transporte",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export const ORDEM_ESTADOS = [
  "PENDENTE",
  "ACEITE",
  "A_CAMINHO",
  "NO_LOCAL",
  "EM_TRANSPORTE",
  "CONCLUIDO",
];

export const ICONES_ESTADO: Record<string, string> = {
  PENDENTE: "🔎",
  ACEITE: "✅",
  A_CAMINHO: "🚚",
  NO_LOCAL: "📍",
  EM_TRANSPORTE: "🛣️",
  CONCLUIDO: "🏁",
  CANCELADO: "❌",
};

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
