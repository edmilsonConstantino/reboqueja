import "server-only";
import { prisma } from "@/lib/prisma";
import { LOCALIZACAO_TTL_MS } from "@/lib/constants";
import { coordenadasValidas } from "@/lib/geo";

/** Estados em que um pedido está em execução pelo condutor (exclui PENDENTE). */
export const ESTADOS_EM_CURSO = [
  "ACEITE",
  "A_CAMINHO",
  "NO_LOCAL",
  "EM_TRANSPORTE",
] as const;

/** Estados em que um pedido ainda está "vivo". */
export const ESTADOS_ACTIVOS = [
  "PENDENTE",
  ...ESTADOS_EM_CURSO,
] as const;

/** Verifica se o camião tem coordenadas válidas e suficientemente recentes. */
export function localizacaoActualizada(
  camiao: {
    lat: number;
    lng: number;
    partilhaLocalizacao?: boolean | null;
    localizacaoActualizadaEm?: Date | string | null;
  } | null
): boolean {
  if (!camiao || !camiao.partilhaLocalizacao) return false;
  if (!coordenadasValidas({ lat: camiao.lat, lng: camiao.lng })) return false;
  if (!camiao.localizacaoActualizadaEm) return false;
  const ts =
    camiao.localizacaoActualizadaEm instanceof Date
      ? camiao.localizacaoActualizadaEm.getTime()
      : new Date(camiao.localizacaoActualizadaEm).getTime();
  return Number.isFinite(ts) && Date.now() - ts <= LOCALIZACAO_TTL_MS;
}

/** Mascara um número de telefone para exposição antes da aceitação do pedido. */
export function mascararTelefone(telefone: string): string {
  const limpo = telefone.trim();
  if (limpo.length <= 6) return limpo;
  return `${limpo.slice(0, 6)} *** ${limpo.slice(-3)}`;
}

/**
 * Camião, empresa e estado operacional do condutor autenticado.
 * - `podeOperar`: conta activa, camião activo e empresa aprovada com consentimento.
 * - `podeReceber`: além de `podeOperar`, condutor marcou "Disponível para serviços" com localização válida.
 */
export async function contextoCondutor(utilizadorId: string) {
  const utilizador = await prisma.utilizador.findUnique({
    where: { id: utilizadorId },
    include: { camiao: { include: { empresa: true } } },
  });
  const camiao = utilizador?.camiao ?? null;
  const empresa = camiao?.empresa ?? null;
  const pertenceEmpresa =
    !utilizador?.empresaCondutorId ||
    !empresa ||
    utilizador.empresaCondutorId === empresa.id;
  const podeOperar = Boolean(
    utilizador?.papel === "CONDUTOR" &&
      utilizador?.activo &&
      pertenceEmpresa &&
      camiao?.activo &&
      empresa?.estadoAprovacao === "APROVADA" &&
      empresa?.consentimentoEm
  );
  const locValida = localizacaoActualizada(camiao);
  const podeReceber = Boolean(podeOperar && camiao?.disponivel && locValida);
  return { utilizador, camiao, empresa, podeOperar, podeReceber, localizacaoValida: locValida };
}
