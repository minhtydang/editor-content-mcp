import { readFile } from "node:fs/promises";
import { config } from "../src/config.js";
import { MongoArticleRepository } from "../src/repositories/mongoRepository.js";
import type { Article } from "../src/types.js";

if (!config.mongoUri) throw new Error("Set MONGODB_URI first");
const articles = JSON.parse(await readFile(new URL("../data/articles.json", import.meta.url), "utf8")) as Article[];
const repo = await MongoArticleRepository.connect(config.mongoUri, config.mongoDb);
await repo.upsertMany(articles);
await repo.close();
console.error(`Seeded ${articles.length} articles`);
