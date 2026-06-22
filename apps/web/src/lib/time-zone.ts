import { env } from "@church-work/env/web";

export function detectedTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
}

type GoogleTimeZoneResponse = {
  status: string;
  timeZoneId?: string;
};

/**
 * Resolve an IANA time zone id (e.g. "America/New_York") for a set of
 * coordinates using the Google Time Zone API. Falls back to the browser's
 * detected time zone when the API key is missing or the request fails.
 */
export async function resolveTimeZoneFromCoordinates(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<string> {
  const apiKey = env.VITE_GOOGLE_PLACES_API_KEY;
  if (!apiKey) return detectedTimeZone();

  const timestamp = Math.floor(Date.now() / 1000);
  const url = new URL("https://maps.googleapis.com/maps/api/timezone/json");
  url.searchParams.set("location", `${latitude},${longitude}`);
  url.searchParams.set("timestamp", String(timestamp));
  url.searchParams.set("key", apiKey);

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) return detectedTimeZone();

    const json = (await response.json()) as GoogleTimeZoneResponse;
    if (json.status === "OK" && json.timeZoneId) return json.timeZoneId;

    return detectedTimeZone();
  } catch {
    return detectedTimeZone();
  }
}
