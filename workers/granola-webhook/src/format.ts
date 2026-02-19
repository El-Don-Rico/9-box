import type { GranolaWebhookPayload } from './types';

export function formatMeetingAsMarkdown(payload: GranolaWebhookPayload): string {
  const date = new Date(payload.meeting_date);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lines: string[] = [];

  lines.push(`## ${payload.meeting_title}`);
  lines.push(`*${formattedDate}*`);
  lines.push('');

  if (payload.summary.trim()) {
    lines.push(payload.summary);
    lines.push('');
  }

  if (payload.action_items.length > 0) {
    lines.push('### Action Items');
    for (const item of payload.action_items) {
      lines.push(`- [ ] ${item}`);
    }
    lines.push('');
  }

  if (payload.attendees && payload.attendees.length > 0) {
    lines.push(`**Attendees:** ${payload.attendees.join(', ')}`);
    lines.push('');
  }

  return lines.join('\n');
}
