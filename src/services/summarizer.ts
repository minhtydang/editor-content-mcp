import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";
import type { Article } from "../types.js";
import { extractiveSummary } from "./text.js";

export interface Summary {
  summary: string;
  source: "llm" | "extractive";
}

export type Summarizer = (article: Article) => Promise<Summary>;

export function createSummarizer(): Summarizer {
  const client = config.anthropicKey ? new Anthropic({ apiKey: config.anthropicKey }) : null;

  return async (article) => {
    if (client) {
      try {
        const res = await client.messages.create(
          {
            model: config.anthropicModel,
            max_tokens: 300,
            messages: [
              {
                role: "user",
                content: `Summarize this article in 3 sentences for an editor. Plain text only.\n\nTitle: ${article.title}\n\n${article.body}`,
              },
            ],
          },
          { timeout: config.llmTimeoutMs },
        );
        const text = res.content
          .map((b) => (b.type === "text" ? b.text : ""))
          .join("")
          .trim();
        if (text) return { summary: text, source: "llm" };
      } catch (err) {
        console.error("[llm] falling back to extractive summary:", (err as Error).message);
      }
    }
    return { summary: extractiveSummary(article.body), source: "extractive" };
  };
}
