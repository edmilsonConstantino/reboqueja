import "server-only";
import { prisma } from "@/lib/prisma";

/** Estados em que um pedido ainda está "vivo". */
export const ESTADOS_ACTIVOS = [
  "PENDENTE",
  "ACEITE",
  "A_CAMINHO",
  "NO_LOCAL",
  "EM_TRANSPORTE",
] as const;

/**
 * Camião e empresa do condutor autenticado.
 * `podeReceber` só é verdadeiro quando o camião está activo e a empresa
 * está aprovada e online — as mesmas condições que a empresa vê no painel.
 */
export async function contextoCondutor(utilizadorId: string) {
  const utilizador = await prisma.utilizador.findUnique({
    where: { id: utilizadorId },
    include: { camiao: { include: { empresa: true } } },
  });
  const camiao = utilizador?.camiao ?? null;
  const empresa = camiao?.empresa ?? null;
  const podeReceber = Boolean(
    camiao?.activo && empresa?.disponivel && empresa?.estadoAprovacao === "APROVADA"
  );
  return { utilizador, camiao, empresa, podeReceber };
}
