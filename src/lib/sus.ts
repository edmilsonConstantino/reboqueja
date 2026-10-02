// Cálculo da pontuação SUS (System Usability Scale) — 10 perguntas, escala 1–5.

export const PERGUNTAS_SUS = [
  "Acho que usaria esta aplicação com frequência.",
  "Achei a aplicação desnecessariamente complexa.",
  "Achei a aplicação fácil de usar.",
  "Acho que precisaria de ajuda de um técnico para usar esta aplicação.",
  "Encontrei as várias funções da aplicação bem integradas.",
  "Achei que havia demasiadas inconsistências na aplicação.",
  "Imagino que a maioria das pessoas aprenderia a usar esta aplicação rapidamente.",
  "Achei a aplicação pouco prática de usar.",
  "Senti-me confiante ao usar a aplicação.",
  "Precisei de aprender muitas coisas antes de conseguir usar a aplicação.",
] as const;

export const PERGUNTAS_EXTRAS = [
  "Usaria esta aplicação numa avaria real?",
  "A faixa de preço ajudou a decidir?",
  "O acompanhamento no mapa deu-lhe segurança?",
] as const;

/**
 * SUS: itens ímpares contam (resposta − 1); pares contam (5 − resposta).
 * Soma × 2,5 → 0 a 100.
 */
export function calcularSus(respostas: number[]): number {
  if (respostas.length !== 10) return 0;
  let soma = 0;
  respostas.forEach((r, i) => {
    const v = Math.min(5, Math.max(1, Math.round(r)));
    soma += i % 2 === 0 ? v - 1 : 5 - v;
  });
  return Math.round(soma * 2.5);
}
