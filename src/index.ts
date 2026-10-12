import { readFile } from "node:fs/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { NoopCache, RedisCache } from "./cache.js";
import { config } from "./config.js";
import { MemoryArticleRepository } from "./repositories/memoryRepository.js";
import { MongoArticleRepository } from "./repositories/mongoRepository.js";
import { ArticleService } from "./services/articleService.js";
import { createSummarizer } from "./services/summarizer.js";
import type { Article, ArticleRepository } from "./types.js";

async function createRepository(): Promise<ArticleRepository> {
  if (config.mongoUri) return MongoArticleRepository.connect(config.mongoUri, config.mongoDb);
  console.error("[init] MONGODB_URI not set, using in-memory sample data");
  const raw = await readFile(new URL("../data/articles.json", import.meta.url), "utf8");
  return new MemoryArticleRepository(JSON.parse(raw) as Article[]);
}

const asText = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
});
const asError = (message: string) => ({
  isError: true,
  content: [{ type: "text" as const, text: message }],
});

async function main() {
  const service = new ArticleService(
    await createRepository(),
    config.redisUrl ? new RedisCache(config.redisUrl) : new NoopCache(),
    createSummarizer(),
    config.summaryTtlSeconds,
  );

  const server = new McpServer({ name: "editor-content-mcp", version: "0.1.0" });

  server.registerTool(
    "search_articles",
    {
      title: "Search articles",
      description: "Search articles by keyword and/or tag. Returns title, category, tags and a short excerpt.",
      inputSchema: {
        query: z.string().min(2).max(200).optional().describe("Keywords to search for"),
        tag: z.string().min(1).max(50).optional().describe("Exact tag filter"),
        limit: z.number().int().min(1).max(20).default(5),
      },
    },
    async ({ query, tag, limit }) => {
      const items = await service.search({ query, tag, limit });
      return asText(
        items.map((a) => ({
          id: a.id,
          title: a.title,
          category: a.category,
          tags: a.tags,
          publishedAt: a.publishedAt,
          excerpt: a.body.slice(0, 160) + (a.body.length > 160 ? "..." : ""),
        })),
      );
    },
  );

  server.registerTool(
    "summarize_article",
    {
      title: "Summarize article",
      description: "Summarize an article by id. Results are cached so repeated calls are fast.",
      inputSchema: { id: z.string().min(1).max(100) },
    },
    async ({ id }) => {
      const result = await service.summarize(id);
      return result ? asText(result) : asError(`Article not found: ${id}`);
    },
  );

  server.registerTool(
    "suggest_tags",
    {
      title: "Suggest tags",
      description: "Suggest tags for a draft: matches existing tags and extracts extra keywords.",
      inputSchema: {
        text: z.string().min(20).max(20000).describe("Draft text"),
        max: z.number().int().min(1).max(10).default(5),
      },
    },
    async ({ text, max }) => asText(await service.suggestTags(text, max)),
  );

  server.registerResource(
    "tags",
    "articles://tags",
    { title: "Tag list", description: "All tags currently in use", mimeType: "application/json" },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(await service.listTags()) }],
    }),
  );

  await server.connect(new StdioServerTransport());
  console.error("[init] editor-content-mcp ready on stdio");
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
