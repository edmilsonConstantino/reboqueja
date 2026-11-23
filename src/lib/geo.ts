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

/** Interpolação linear entre dois pontos (t entre 0 e 1) — para simular trajectos. */
export function interpolar(a: LatLng, b: LatLng, t: number): LatLng {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}
