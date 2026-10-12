import { MongoClient, type Collection, type Filter } from "mongodb";
import type { Article, ArticleRepository, SearchParams } from "../types.js";

type ArticleDoc = Omit<Article, "id"> & { _id: string };

export class MongoArticleRepository implements ArticleRepository {
  private constructor(
    private readonly client: MongoClient,
    private readonly col: Collection<ArticleDoc>,
  ) {}

  static async connect(uri: string, dbName: string) {
    const client = new MongoClient(uri);
    await client.connect();
    const col = client.db(dbName).collection<ArticleDoc>("articles");
    await col.createIndex({ title: "text", body: "text", tags: "text" });
    await col.createIndex({ tags: 1 });
    await col.createIndex({ publishedAt: -1 });
    return new MongoArticleRepository(client, col);
  }

  async search({ query, tag, limit }: SearchParams): Promise<Article[]> {
    const filter: Filter<ArticleDoc> = {};
    if (tag) filter.tags = tag.toLowerCase();
    if (query) filter.$text = { $search: query };

    const cursor = this.col.find(
      filter,
      query ? { projection: { score: { $meta: "textScore" } } } : undefined,
    );
    const docs = await (query
      ? cursor.sort({ score: { $meta: "textScore" } })
      : cursor.sort({ publishedAt: -1 })
    )
      .limit(limit)
      .toArray();
    return docs.map(toArticle);
  }

  async getById(id: string): Promise<Article | null> {
    const doc = await this.col.findOne({ _id: id });
    return doc ? toArticle(doc) : null;
  }

  async listTags(): Promise<string[]> {
    const tags = await this.col.distinct("tags");
    return tags.sort();
  }

  async upsertMany(articles: Article[]): Promise<void> {
    if (articles.length === 0) return;
    await this.col.bulkWrite(
      articles.map(({ id, ...rest }) => ({
        replaceOne: {
          filter: { _id: id },
          replacement: { _id: id, ...rest, tags: rest.tags.map((t) => t.toLowerCase()) },
          upsert: true,
        },
      })),
    );
  }

  async close() {
    await this.client.close();
  }
}

function toArticle({ _id, ...rest }: ArticleDoc & { score?: number }): Article {
  const { score: _score, ...article } = rest as typeof rest & { score?: number };
  return { id: _id, ...article };
}
