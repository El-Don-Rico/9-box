import type { GranolaWebhookPayload } from './types';

export function validatePayload(
  body: unknown
): { ok: true; data: GranolaWebhookPayload } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const obj = body as Record<string, unknown>;

  if (typeof obj.meeting_title !== 'string' || obj.meeting_title.trim() === '') {
    return { ok: false, error: 'meeting_title is required and must be a non-empty string' };
  }

  if (typeof obj.meeting_date !== 'string' || obj.meeting_date.trim() === '') {
    return { ok: false, error: 'meeting_date is required and must be a non-empty string' };
  }

  if (isNaN(Date.parse(obj.meeting_date))) {
    return { ok: false, error: 'meeting_date must be a valid ISO date string' };
  }

  if (typeof obj.summary !== 'string') {
    return { ok: false, error: 'summary is required and must be a string' };
  }

  if (
    !Array.isArray(obj.action_items) ||
    !obj.action_items.every((item: unknown) => typeof item === 'string')
  ) {
    return { ok: false, error: 'action_items is required and must be an array of strings' };
  }

  if (obj.attendees !== undefined) {
    if (
      !Array.isArray(obj.attendees) ||
      !obj.attendees.every((item: unknown) => typeof item === 'string')
    ) {
      return { ok: false, error: 'attendees must be an array of strings if provided' };
    }
  }

  return {
    ok: true,
    data: {
      meeting_title: obj.meeting_title,
      meeting_date: obj.meeting_date,
      summary: obj.summary,
      action_items: obj.action_items as string[],
      attendees: obj.attendees as string[] | undefined,
    },
  };
}
