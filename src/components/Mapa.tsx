"use client";

import dynamic from "next/dynamic";
import type { MarcadorMapa } from "./MapaLibre";
import type { LatLng } from "@/lib/geo";

export type { MarcadorMapa };

const MapaInterno = dynamic(() => import("./MapaLibre").then((m) => m.MapaLibre), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-neutral-100 dark:bg-neutral-900">
      <div className="w-9 h-9 rounded-full border-4 border-primary-400 border-t-transparent animate-spin" />
    </div>
  ),
});

export function Mapa(props: {
  centro?: LatLng;
  zoom?: number;
  marcadores?: MarcadorMapa[];
  linha?: [LatLng, LatLng] | null;
  poligonoMatola?: boolean;
  aoClicar?: (p: LatLng) => void;
  className?: string;
  encaixarEm?: boolean;
}) {
  return <MapaInterno {...props} />;
}
