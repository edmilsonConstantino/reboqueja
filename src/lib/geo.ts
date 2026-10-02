// Utilidades geográficas: Haversine, polígono aproximado da Cidade da Matola e point-in-polygon.

export type LatLng = { lat: number; lng: number };

/** Polígono aproximado dos limites da Cidade da Matola. */
export const POLIGONO_MATOLA: LatLng[] = [
  { lat: -25.902, lng: 32.395 },
  { lat: -25.905, lng: 32.47 },
  { lat: -25.925, lng: 32.53 },
  { lat: -25.962, lng: 32.575 },
  { lat: -26.02, lng: 32.585 },
  { lat: -26.08, lng: 32.56 },
  { lat: -26.115, lng: 32.5 },
  { lat: -26.1, lng: 32.44 },
  { lat: -26.055, lng: 32.395 },
  { lat: -25.985, lng: 32.375 },
  { lat: -25.94, lng: 32.375 },
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
