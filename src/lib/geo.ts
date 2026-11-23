// Utilidades geográficas: Haversine, polígono aproximado da Cidade da Matola e point-in-polygon.

export type LatLng = { lat: number; lng: number };

/**
 * Polígono aproximado da área de cobertura: todo o município da Matola
 * (Machava, Matola Rio, Matola Gare, T3, Fomento, Liberdade, Infulene, Sungo,
 * Marrote, Muanono, Matola A/B/C) e a zona de Zimpeto, a norte.
 */
export const POLIGONO_MATOLA: LatLng[] = [
  { lat: -25.875, lng: 32.385 },
  { lat: -25.845, lng: 32.44 },
  { lat: -25.828, lng: 32.5 },
  { lat: -25.84, lng: 32.562 },
  { lat: -25.9, lng: 32.568 },
  { lat: -25.96, lng: 32.565 },
  { lat: -26.02, lng: 32.56 },
  { lat: -26.085, lng: 32.545 },
  { lat: -26.125, lng: 32.5 },
  { lat: -26.105, lng: 32.43 },
  { lat: -26.055, lng: 32.378 },
  { lat: -25.98, lng: 32.355 },
  { lat: -25.92, lng: 32.362 },
];

/** Distância em km entre dois pontos (Haversine). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Ray casting: o ponto está dentro do polígono? */
export function pontoNoPoligono(p: LatLng, poligono: LatLng[]): boolean {
  let dentro = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const xi = poligono[i].lng;
    const yi = poligono[i].lat;
    const xj = poligono[j].lng;
    const yj = poligono[j].lat;
    const cruza =
      yi > p.lat !== yj > p.lat &&
      p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi;
    if (cruza) dentro = !dentro;
  }
  return dentro;
}

/** A área de cobertura inclui toda a Matola e Zimpeto. */
export function estaNaMatola(p: LatLng): boolean {
  return pontoNoPoligono(p, POLIGONO_MATOLA);
}

/** Interpolação linear entre dois pontos (t entre 0 e 1). */
export function interpolar(a: LatLng, b: LatLng, t: number): LatLng {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}

/** Verifica se um par de coordenadas representa uma posição geográfica real e não-nula. */
export function coordenadasValidas(p?: { lat?: number | null; lng?: number | null } | null): p is LatLng {
  if (!p || typeof p.lat !== "number" || typeof p.lng !== "number") return false;
  if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return false;
  if (p.lat === 0 && p.lng === 0) return false;
  return p.lat >= -90 && p.lat <= 90 && p.lng >= -180 && p.lng <= 180;
}

export type ResultadoRota =
  | {
      disponivel: true;
      fonteRota: "OSRM";
      distanciaEstradaKm: number;
      tempoEstimadoMin: number;
      geometria: LatLng[];
    }
  | {
      disponivel: false;
      fonteRota: "INDISPONIVEL";
      distanciaEstradaKm: null;
      tempoEstimadoMin: null;
      geometria: null;
    };

/**
 * Calcula distância real por estrada e tempo estimado via OSRM público.
 * Nunca fabrica estimativas caso o serviço esteja indisponível.
 */
export async function calcularRotaOSRM(
  origem: LatLng,
  destino: LatLng,
  timeoutMs = 2500
): Promise<ResultadoRota> {
  if (!coordenadasValidas(origem) || !coordenadasValidas(destino)) {
    return {
      disponivel: false,
      fonteRota: "INDISPONIVEL",
      distanciaEstradaKm: null,
      tempoEstimadoMin: null,
      geometria: null,
    };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origem.lng},${origem.lat};${destino.lng},${destino.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, {
      signal: ctrl.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return {
        disponivel: false,
        fonteRota: "INDISPONIVEL",
        distanciaEstradaKm: null,
        tempoEstimadoMin: null,
        geometria: null,
      };
    }
    const data = (await res.json()) as {
      code?: string;
      routes?: {
        distance?: number;
        duration?: number;
        geometry?: { coordinates?: [number, number][] };
      }[];
    };
    const rota = data.routes?.[0];
    if (data.code !== "Ok" || !rota || typeof rota.distance !== "number" || typeof rota.duration !== "number") {
      return {
        disponivel: false,
        fonteRota: "INDISPONIVEL",
        distanciaEstradaKm: null,
        tempoEstimadoMin: null,
        geometria: null,
      };
    }

    const coords = (rota.geometry?.coordinates ?? []).map(([lng, lat]) => ({ lat, lng }));
    return {
      disponivel: true,
      fonteRota: "OSRM",
      distanciaEstradaKm: Math.round((rota.distance / 1000) * 100) / 100,
      tempoEstimadoMin: Math.max(1, Math.round(rota.duration / 60)),
      geometria: coords.length >= 2 ? coords : [origem, destino],
    };
  } catch {
    return {
      disponivel: false,
      fonteRota: "INDISPONIVEL",
      distanciaEstradaKm: null,
      tempoEstimadoMin: null,
      geometria: null,
    };
  } finally {
    clearTimeout(timer);
  }
}
