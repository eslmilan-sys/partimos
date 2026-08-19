import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { ALL_CITIES, CORRIDORS } from "@/lib/corridors";

/**
 * Journalisation d'une recherche infructueuse + préinscription.
 *
 * Deux écritures dans la même requête :
 *   · `demand_signals` — le signal produit : quel corridor, quelle date,
 *     combien de places. C'est ce qui déclenche l'alerte aux conducteurs et
 *     ce qui dit quel corridor ouvrir ensuite.
 *   · `waitlist_signals` — le numéro à rappeler, isolé dans sa propre table
 *     pour ne pas mêler une donnée personnelle à une table d'analyse.
 *
 * Le numéro n'est jamais renvoyé au client et la table n'est pas lisible via
 * l'API publique (RLS refuse tout SELECT anonyme, voir la migration).
 */

export const runtime = "nodejs";

/** Garde-fou minimal contre le remplissage automatisé. En production, le
 *  remplacer par une limitation au niveau de la plateforme (Vercel WAF). */
const RECENT = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (RECENT.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  RECENT.set(key, hits);
  if (RECENT.size > 5000) RECENT.clear(); // borne mémoire, pas une politique
  return hits.length > MAX_PER_WINDOW;
}

/** Numéro panaméen → E.164. Un 8 chiffres local devient +507xxxxxxxx. */
function normalizePhone(digits: string): string | null {
  if (digits.length === 7 || digits.length === 8) return `+507${digits}`;
  if (digits.length >= 10 && digits.length <= 13) return `+${digits}`;
  return null;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "too_many_requests" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const phone = normalizePhone(String(body.phone ?? "").replace(/\D/g, ""));
  const originSlug = String(body.originSlug ?? "");
  const destinationSlug = String(body.destinationSlug ?? "");
  const requestedDate = String(body.requestedDate ?? "");
  const seats = Math.min(4, Math.max(1, Number(body.seats) || 1));
  const source = String(body.source ?? "web").slice(0, 40);

  const originKnown = ALL_CITIES.some((c) => c.slug === originSlug);
  const destinationKnown = ALL_CITIES.some((c) => c.slug === destinationSlug);
  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate);

  if (!phone || !originKnown || !destinationKnown || !dateValid) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const corridorSlug =
    CORRIDORS.find(
      (c) =>
        c.origin.slug === originSlug && c.destination.slug === destinationSlug,
    )?.slug ?? null;

  const supabase = getServiceSupabase();
  if (!supabase) {
    // Le projet Supabase est une étape ⛔ HUMAIN. Tant qu'il n'existe pas, on
    // le dit franchement plutôt que de promettre une alerte qui ne partira pas.
    console.warn("[demanda] Supabase non configuré — signal non enregistré", {
      originSlug,
      destinationSlug,
      requestedDate,
    });
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }

  const { data: cities, error: citiesError } = await supabase
    .from("cities")
    .select("id, slug")
    .in("slug", [originSlug, destinationSlug]);

  if (citiesError) {
    console.error("[demanda] lecture cities", citiesError);
    return NextResponse.json({ error: "storage_error" }, { status: 502 });
  }

  const cityId = (slug: string) =>
    cities?.find((c) => c.slug === slug)?.id ?? null;

  let corridorId: string | null = null;
  if (corridorSlug) {
    const { data } = await supabase
      .from("corridors")
      .select("id")
      .eq("slug", corridorSlug)
      .maybeSingle();
    corridorId = data?.id ?? null;
  }

  const { data: signal, error: signalError } = await supabase
    .from("demand_signals")
    .insert({
      corridor_id: corridorId,
      origin_city_id: cityId(originSlug),
      destination_city_id: cityId(destinationSlug),
      requested_date: requestedDate,
      seats_wanted: seats,
      results_count: 0,
      source,
    })
    .select("id")
    .single();

  if (signalError) {
    console.error("[demanda] insertion demand_signals", signalError);
    return NextResponse.json({ error: "storage_error" }, { status: 502 });
  }

  const { error: waitlistError } = await supabase
    .from("waitlist_signals")
    .insert({
      demand_signal_id: signal.id,
      phone,
      locale: "es",
    });

  if (waitlistError) {
    console.error("[demanda] insertion waitlist_signals", waitlistError);
    return NextResponse.json({ error: "storage_error" }, { status: 502 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
