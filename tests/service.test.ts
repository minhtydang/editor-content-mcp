import { describe, expect, it, vi } from "vitest";
import { MemoryArticleRepository } from "../src/repositories/memoryRepository.js";
import { ArticleService } from "../src/services/articleService.js";
import type { Article, Cache } from "../src/types.js";

const articles: Article[] = [
  { id: "a1", title: "API design basics", body: "Pagination matters. Errors matter.", tags: ["api", "backend"], category: "Tech", publishedAt: "2026-09-10" },
  { id: "a2", title: "Street food guide", body: "Banh mi is great.", tags: ["food"], category: "Food", publishedAt: "2026-09-12" },
];

class MapCache implements Cache {
  store = new Map<string, string>();
  async get(k: string) { return this.store.get(k) ?? null; }
  async set(k: string, v: string) { this.store.set(k, v); }
}

function setup() {
  const summarizer = vi.fn(async () => ({ summary: "short", source: "extractive" as const }));
  const service = new ArticleService(new MemoryArticleRepository(articles), new MapCache(), summarizer, 60);
  return { service, summarizer };
}

describe("ArticleService", () => {
  it("searches by keyword and tag", async () => {
    const { service } = setup();
    expect((await service.search({ query: "pagination", limit: 5 })).map((a) => a.id)).toEqual(["a1"]);
    expect((await service.search({ tag: "food", limit: 5 })).map((a) => a.id)).toEqual(["a2"]);
  });

  it("caches summaries so the summarizer runs once", async () => {
    const { service, summarizer } = setup();
    const first = await service.summarize("a1");
    const second = await service.summarize("a1");
    expect(first?.cached).toBe(false);
    expect(second?.cached).toBe(true);
    expect(summarizer).toHaveBeenCalledTimes(1);
  });

  it("returns null for unknown articles and does not call the summarizer", async () => {
    const { service, summarizer } = setup();
    expect(await service.summarize("nope")).toBeNull();
    expect(summarizer).not.toHaveBeenCalled();
  });
});
