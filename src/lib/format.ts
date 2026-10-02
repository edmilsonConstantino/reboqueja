// Formatos de Moçambique: moeda MT, telefone +258 8X XXX XXXX, datas dd/mm/aaaa.

export function formatarMT(valor: number): string {
  const s = Math.round(valor).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${s} MT`;
}

export function faixaPrecoTexto(min: number, max: number): string {
  return `${formatarMT(min)} – ${formatarMT(max)}`;
}

export function formatarTelefone(t: string): string {
  const d = t.replace(/\D/g, "");
  const local = d.startsWith("258") ? d.slice(3) : d;
  if (local.length !== 9) return t;
  return `+258 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
}

export function formatarData(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${dt.getFullYear()}`;
}

export function formatarDataHora(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  const hh = String(dt.getHours()).padStart(2, "0");
  const mi = String(dt.getMinutes()).padStart(2, "0");
  return `${formatarData(dt)} ${hh}:${mi}`;
}

export function formatarKm(km: number): string {
  return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
}

export function formatarMinutos(min: number): string {
  return `${Math.max(1, Math.round(min))} min`;
}
