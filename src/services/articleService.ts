import type { Article, ArticleRepository, Cache } from "../types.js";
import type { Summarizer, Summary } from "./summarizer.js";
import { suggestTags, type TagSuggestion } from "./text.js";

export class ArticleService {
  constructor(
    private readonly repo: ArticleRepository,
    private readonly cache: Cache,
    private readonly summarizer: Summarizer,
    private readonly summaryTtlSeconds: number,
  ) {}

  search(params: { query?: string; tag?: string; limit: number }): Promise<Article[]> {
    return this.repo.search(params);
  }

  listTags(): Promise<string[]> {
    return this.repo.listTags();
  }

  async summarize(id: string): Promise<(Summary & { cached: boolean }) | null> {
    const key = `summary:${id}`;
    const hit = await this.cache.get(key);
    if (hit) return { ...(JSON.parse(hit) as Summary), cached: true };

    const article = await this.repo.getById(id);
    if (!article) return null;

    const result = await this.summarizer(article);
    await this.cache.set(key, JSON.stringify(result), this.summaryTtlSeconds);
    return { ...result, cached: false };
  }

  async suggestTags(text: string, max: number): Promise<TagSuggestion> {
    return suggestTags(text, await this.repo.listTags(), max);
  }
}
