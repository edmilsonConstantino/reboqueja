import { ok, tratarErroApi } from "@/lib/api";
import type { NextRequest } from "next/server";
import { estaNaMatola } from "@/lib/geo";

/** Endereço a partir de coordenadas (Nominatim reverse). */
export async function GET(req: NextRequest) {
  try {
    const lat = parseFloat(req.nextUrl.searchParams.get("lat") || "");
    const lng = parseFloat(req.nextUrl.searchParams.get("lng") || "");
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return ok({ label: null });
    }

    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: "jsonv2",
      zoom: "17",
      "accept-language": "pt",
    });
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        headers: {
          "User-Agent": "ReboqueJa-MVP/0.1 (prototipo academico)",
          "Accept-Language": "pt",
        },
        next: { revalidate: 30 },
      }
    );
    if (!res.ok) return ok({ label: null });
    const dados = (await res.json()) as { display_name?: string };
    return ok({
      label: dados.display_name || null,
      naMatola: estaNaMatola({ lat, lng }),
    });
  } catch {
    return ok({ label: null });
  }
}

export const dynamic = "force-dynamic";
