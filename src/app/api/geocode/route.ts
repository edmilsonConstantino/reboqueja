import { ok, tratarErroApi } from "@/lib/api";
import type { NextRequest } from "next/server";
import { estaNaMatola } from "@/lib/geo";

/**
 * Pesquisa de endereços via Nominatim (OpenStreetMap), limitada à zona da Matola.
 * Procuramos sempre no servidor para controlar o User-Agent e evitar CORS.
 */
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 3) return ok({ resultados: [] });

    const params = new URLSearchParams({
      q: `${q}, Matola, Moçambique`,
      format: "jsonv2",
      addressdetails: "1",
      limit: "6",
      // viewbox aproximado da Matola (esq, topo, dir, baixo) + bounded
      viewbox: "32.37,-26.12,32.59,-25.90",
      bounded: "1",
      "accept-language": "pt",
    });

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          "User-Agent": "ReboqueJa-MVP/0.1 (prototipo academico)",
          "Accept-Language": "pt",
        },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return ok({ resultados: [] });
    const dados = (await res.json()) as {
      lat: string;
      lon: string;
      display_name: string;
    }[];

    const resultados = dados
      .map((d) => ({
        lat: parseFloat(d.lat),
        lng: parseFloat(d.lon),
        label: d.display_name,
      }))
      .filter((r) => estaNaMatola(r));

    return ok({ resultados });
  } catch (e) {
    return tratarErroApi(e);
  }
}

export const dynamic = "force-dynamic";
