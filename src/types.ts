export interface Article {
  id: string;
  title: string;
  body: string;
  tags: string[];
  category: string;
  publishedAt: string;
}

export interface SearchParams {
  query?: string;
  tag?: string;
  limit: number;
}

export interface ArticleRepository {
  search(params: SearchParams): Promise<Article[]>;
  getById(id: string): Promise<Article | null>;
  listTags(): Promise<string[]>;
}

export interface Cache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
}
