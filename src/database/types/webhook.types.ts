/**
 * Type for the webhook payload from GitHub
 */
export interface GitHubWebhookPayload {
  repository?: {
    full_name?: string;
    html_url?: string;
    owner?: {
      name?: string;
      login?: string;
    };
    name?: string;
  };
  ref?: string;
  after?: string;
  before?: string;
  commits?: Array<{
    id?: string;
    message?: string;
    timestamp?: string;
    author?: {
      name?: string;
      email?: string;
    };
    added?: string[];
    modified?: string[];
    removed?: string[];
  }>;
  sender?: {
    login?: string;
  };
}
