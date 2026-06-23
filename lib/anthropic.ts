import Anthropic from "@anthropic-ai/sdk";

export const MODEL_ID = "claude-sonnet-4-6";
export const MAX_TOKENS_FEEDBACK = 1500;
export const MAX_TOKENS_COACH = 2000;
export const MAX_TOKENS_SYNTHESE = 2500;

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY manquante. Renseignez-la dans .env.local (cf .env.example).",
      );
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}
