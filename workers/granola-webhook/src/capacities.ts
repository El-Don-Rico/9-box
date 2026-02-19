import type { Env } from './types';

const CAPACITIES_API_URL = 'https://api.capacities.io/save-to-daily-note';

interface CapacitiesResponse {
  ok: boolean;
  status: number;
  body?: unknown;
}

export async function saveToDailyNote(
  mdText: string,
  env: Env
): Promise<CapacitiesResponse> {
  const response = await fetch(CAPACITIES_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CAPACITIES_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      spaceId: env.CAPACITIES_SPACE_ID,
      mdText,
    }),
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = await response.text().catch(() => null);
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}
