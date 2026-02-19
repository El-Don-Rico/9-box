import type { Env } from './types';
import { validatePayload } from './validate';
import { formatMeetingAsMarkdown } from './format';
import { saveToDailyNote } from './capacities';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health' && request.method === 'GET') {
      return Response.json({ status: 'ok' });
    }

    if (url.pathname === '/webhook' && request.method === 'POST') {
      return handleWebhook(request, env);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  },
} satisfies ExportedHandler<Env>;

async function handleWebhook(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const validation = validatePayload(body);
  if (!validation.ok) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const markdown = formatMeetingAsMarkdown(validation.data);

  const result = await saveToDailyNote(markdown, env);

  if (!result.ok) {
    const status = result.status === 429 ? 429 : 502;
    return Response.json(
      {
        error: 'Failed to save to Capacities',
        upstream_status: result.status,
        details: result.body,
      },
      { status }
    );
  }

  return Response.json({
    success: true,
    message: 'Meeting notes saved to daily note',
  });
}
