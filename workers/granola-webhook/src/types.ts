export interface Env {
  CAPACITIES_API_KEY: string;
  CAPACITIES_SPACE_ID: string;
}

export interface GranolaWebhookPayload {
  meeting_title: string;
  meeting_date: string;
  summary: string;
  action_items: string[];
  attendees?: string[];
}
