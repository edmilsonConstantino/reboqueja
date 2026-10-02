"use client";

import { QuestionarioPrototipo } from "@/components/QuestionarioPrototipo";

export default function AvaliacaoPrototipoCondutor() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-extrabold mb-1">Avaliação do protótipo</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        Este questionário é anónimo no relatório final e faz parte do trabalho
        académico. Leva ~2 minutos.
      </p>
      <QuestionarioPrototipo />
    </div>
  );
}
