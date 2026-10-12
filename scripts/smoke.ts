// Starts the server over stdio and calls each tool, exactly like an MCP client would.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "npx",
  args: ["tsx", "src/index.ts"],
  env: { ...process.env } as Record<string, string>,
});
const client = new Client({ name: "smoke", version: "0.0.0" });
await client.connect(transport);

const tools = await client.listTools();
console.log("tools:", tools.tools.map((t) => t.name).join(", "));

const show = (label: string, r: unknown) =>
  console.log(`\n# ${label}\n${(r as { content: { text: string }[] }).content[0].text}`);

show("search_articles", await client.callTool({ name: "search_articles", arguments: { query: "remote work", limit: 2 } }));
show("summarize_article (1st)", await client.callTool({ name: "summarize_article", arguments: { id: "ai-newsroom" } }));
show("suggest_tags", await client.callTool({ name: "suggest_tags", arguments: { text: "Newsrooms use AI to suggest tags for editorial teams in the media industry." } }));
show("summarize_article (missing)", await client.callTool({ name: "summarize_article", arguments: { id: "does-not-exist" } }));
show("invalid input", await client.callTool({ name: "search_articles", arguments: { limit: 99 } }).catch((e) => ({ content: [{ text: `rejected: ${(e as Error).message}` }] })));

await client.close();
