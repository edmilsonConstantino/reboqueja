"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl, { LngLatBoundsLike, Marker } from "maplibre-gl";
import { CENTRO_MATOLA } from "@/lib/constants";
import type { LatLng } from "@/lib/geo";

// Importa o CSS do MapLibre (empacotado pelo Next)
import "maplibre-gl/dist/maplibre-gl.css";

export const ESTILO_OSM: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export type MarcadorMapa = {
  id: string;
  pos: LatLng;
  cor?: string;
  emoji?: string;
  pulso?: boolean;
  titulo?: string;
  aoClicar?: () => void;
};

export function MapaLibre({
  centro = CENTRO_MATOLA,
  zoom = 13,
  marcadores = [],
  linha = null,
  poligonoMatola = false,
  aoClicar,
  className = "",
  encaixarEm,
  escuro = false,
  controlos = false,
  aoLocalizar,
}: {
  centro?: LatLng;
  zoom?: number;
  marcadores?: MarcadorMapa[];
  /** Pontos para desenhar trajecto/linha (ex.: rota por estrada ou camião → origem). */
  linha?: LatLng[] | null;
  poligonoMatola?: boolean;
  aoClicar?: (p: LatLng) => void;
  className?: string;
  /** Encaixa a vista nos marcadores (fitBounds). */
  encaixarEm?: boolean;
  /** Aplica um filtro escuro aos tiles (os marcadores não são afectados). */
  escuro?: boolean;
  /** Mostra botões de zoom (+/−) sobre o mapa. */
  controlos?: boolean;
  /** Se definido, mostra o botão "a minha localização". */
  aoLocalizar?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<maplibregl.Map | null>(null);
  const marcadoresRef = useRef<Map<string, Marker>>(new Map());
  const [pronto, setPronto] = useState(false);

  // Clique (actualiza handler sem recrear mapa)
  const cliqueRef = useRef(aoClicar);
  useEffect(() => {
    cliqueRef.current = aoClicar;
  }, [aoClicar]);

  // Inicializa
  useEffect(() => {
    if (!ref.current || mapaRef.current) return;
    const mapaMarcadores = marcadoresRef.current;
    const mapa = new maplibregl.Map({
      container: ref.current,
      style: ESTILO_OSM as never,
      center: [centro.lng, centro.lat],
      zoom,
      attributionControl: { compact: true },
    });
    mapaRef.current = mapa;
    mapa.on("load", () => setPronto(true));
    mapa.on("click", (e) => {
      cliqueRef.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });
    return () => {
      mapa.remove();
      mapaRef.current = null;
      mapaMarcadores.clear();
      setPronto(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Marcadores
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !pronto) return;

    const idsNovos = new Set(marcadores.map((m) => m.id));
    for (const [id, marker] of marcadoresRef.current) {
      if (!idsNovos.has(id)) {
        marker.remove();
        marcadoresRef.current.delete(id);
      }
    }

    marcadores.forEach((m) => {
      const el = document.createElement("div");
      el.className = `relative grid place-items-center ${m.aoClicar ? "cursor-pointer" : ""}`;
      if (m.titulo) el.title = m.titulo;
      el.innerHTML = `
        ${m.pulso ? `<span class="absolute w-10 h-10 rounded-full rj-radar" style="background:${m.cor || "#FFC300"};opacity:.35"></span>` : ""}
        <span class="relative w-9 h-9 rounded-full grid place-items-center text-base shadow-card border-2 border-white" style="background:${m.cor || "#FFC300"}">${m.emoji || "📍"}</span>
      `;
      if (m.aoClicar) {
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          m.aoClicar?.();
        });
      }
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([m.pos.lng, m.pos.lat])
        .addTo(mapa);
      const existente = marcadoresRef.current.get(m.id);
      if (existente) existente.remove();
      marcadoresRef.current.set(m.id, marker);
    });

    if (encaixarEm && marcadores.length > 0) {
      const bounds: LngLatBoundsLike = [
        [
          Math.min(...marcadores.map((m) => m.pos.lng)),
          Math.min(...marcadores.map((m) => m.pos.lat)),
        ],
        [
          Math.max(...marcadores.map((m) => m.pos.lng)),
          Math.max(...marcadores.map((m) => m.pos.lat)),
        ],
      ];
      mapa.fitBounds(bounds, { padding: 80, maxZoom: 16, duration: 600 });
    }
  }, [marcadores, pronto, encaixarEm]);

  // Linha de trajecto
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !pronto) return;
    const src = mapa.getSource("rj-linha") as maplibregl.GeoJSONSource | undefined;
    const dadosLinha =
      linha && linha.length >= 2
        ? {
            type: "FeatureCollection" as const,
            features: [
              {
                type: "Feature" as const,
                properties: {},
                geometry: {
                  type: "LineString" as const,
                  coordinates: linha.map((p) => [p.lng, p.lat]),
                },
              },
            ],
          }
        : { type: "FeatureCollection" as const, features: [] };

    if (!src) {
      mapa.addSource("rj-linha", { type: "geojson", data: dadosLinha as never });
      mapa.addLayer({
        id: "rj-linha-c",
        type: "line",
        source: "rj-linha",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#FFC300",
          "line-width": 4,
          "line-dasharray": [1, 1.5],
        },
      });
    } else {
      src.setData(dadosLinha as never);
    }
  }, [linha, pronto]);

  // Polígono da Matola
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !pronto) return;
    if (!poligonoMatola) return;
    const coords = [
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
      { lat: -25.902, lng: 32.395 },
    ].map((p) => [p.lng, p.lat]);

    if (!mapa.getSource("rj-matola")) {
      mapa.addSource("rj-matola", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [coords] },
        } as never,
      });
      mapa.addLayer({
        id: "rj-matola-fill",
        type: "fill",
        source: "rj-matola",
        paint: { "fill-color": "#FFC300", "fill-opacity": 0.08 },
      });
      mapa.addLayer({
        id: "rj-matola-line",
        type: "line",
        source: "rj-matola",
        paint: { "line-color": "#FFC300", "line-width": 2, "line-dasharray": [2, 1] },
      });
    }
  }, [poligonoMatola, pronto]);

  // Reencentra quando o centro muda explicitamente
  const centroChave = `${centro.lat},${centro.lng}`;
  const primeiroCentro = useRef(centroChave);
  useEffect(() => {
    if (!mapaRef.current || !pronto) return;
    if (primeiroCentro.current !== centroChave) {
      primeiroCentro.current = centroChave;
      mapaRef.current.easeTo({ center: [centro.lng, centro.lat], zoom, duration: 600 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centroChave, pronto]);

  return (
    <div className={`relative ${escuro ? "rj-mapa-escuro" : ""} ${className}`}>
      <div ref={ref} className="absolute inset-0" />
      {(controlos || aoLocalizar) && pronto && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
          {controlos && (
            <div className="flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-white/15 bg-white/90 dark:bg-[#070B14]/85 backdrop-blur shadow-lg">
              <button
                type="button"
                aria-label="Aproximar"
                onClick={() => mapaRef.current?.zoomIn()}
                className="w-10 h-10 grid place-items-center text-xl text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
              >
                +
              </button>
              <span className="h-px bg-slate-200 dark:bg-white/10" />
              <button
                type="button"
                aria-label="Afastar"
                onClick={() => mapaRef.current?.zoomOut()}
                className="w-10 h-10 grid place-items-center text-xl text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
              >
                −
              </button>
            </div>
          )}
          {aoLocalizar && (
            <button
              type="button"
              aria-label="Usar a minha localização"
              title="Usar a minha localização"
              onClick={aoLocalizar}
              className="w-10 h-10 grid place-items-center rounded-xl border border-slate-200 dark:border-white/15 bg-white/90 dark:bg-[#070B14]/85 backdrop-blur shadow-lg text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-primary-400 transition"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <circle cx="12" cy="12" r="7" />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
            </button>
          )}
        </div>
      )}
      {!pronto && (
        <div className="absolute inset-0 grid place-items-center bg-slate-100 dark:bg-[#0E1629]">
          <div className="w-9 h-9 rounded-full border-4 border-primary-400 border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}

/** Carrega o MapLibre só no cliente (dynamic import helper). */
export function useMapaDinamico() {
  const [Comp, setComp] = useState<null | React.ComponentType<never>>(null);
  const carregar = useCallback(async () => {
    if (Comp) return Comp;
    const mod = await import("./MapaLibre");
    setComp(() => mod.MapaLibre as unknown as React.ComponentType<never>);
    return Comp;
  }, [Comp]);
  return { Comp, carregar };
}
