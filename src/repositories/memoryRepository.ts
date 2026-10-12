import type { Article, ArticleRepository, SearchParams } from "../types.js";

export class MemoryArticleRepository implements ArticleRepository {
  constructor(private readonly articles: Article[]) {}

  async search({ query, tag, limit }: SearchParams): Promise<Article[]> {
    let items = this.articles;
    if (tag) {
      const t = tag.toLowerCase();
      items = items.filter((a) => a.tags.some((x) => x.toLowerCase() === t));
    }
    if (!query) {
      return [...items]
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
        .slice(0, limit);
    }
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return items
      .map((a) => {
        const title = a.title.toLowerCase();
        const body = a.body.toLowerCase();
        const tags = a.tags.join(" ").toLowerCase();
        const score = terms.reduce(
          (s, t) =>
            s +
            (title.includes(t) ? 3 : 0) +
            (tags.includes(t) ? 2 : 0) +
            (body.includes(t) ? 1 : 0),
          0,
        );
        return { a, score };
      })
      .filter((x) => x.score > 0)
      .sort((x, y) => y.score - x.score)
      .slice(0, limit)
      .map((x) => x.a);
  }

  async getById(id: string): Promise<Article | null> {
    return this.articles.find((a) => a.id === id) ?? null;
  }

  async listTags(): Promise<string[]> {
    return [...new Set(this.articles.flatMap((a) => a.tags))].sort();
  }
}
