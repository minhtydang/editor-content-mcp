export const config = {
  mongoUri: process.env.MONGODB_URI,
  mongoDb: process.env.MONGODB_DB ?? "editor_content",
  redisUrl: process.env.REDIS_URL,
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-haiku-5-5",
  summaryTtlSeconds: Number(process.env.SUMMARY_TTL_SECONDS ?? 3600),
  llmTimeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 15000),
};
