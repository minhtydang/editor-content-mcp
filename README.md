# editor-content-mcp

MCP server that gives AI clients three editor tools over an article store: search, summarize, suggest tags.

TypeScript · MCP SDK · MongoDB · Redis · optional Claude API

## Tools

| Tool | Input | What it does |
|---|---|---|
| `search_articles` | `query?`, `tag?`, `limit` (1-20) | Keyword/tag search, returns id, title, tags, excerpt |
| `summarize_article` | `id` | 3-sentence summary, cached in Redis by article id |
| `suggest_tags` | `text`, `max` (1-10) | Matches existing tags and extracts extra keywords |

Resource: `articles://tags` lists every tag in use.

## Run

```bash
npm install
npm run smoke        # no setup needed: in-memory sample data, calls every tool
```

With MongoDB and Redis:

```bash
docker compose up -d
cp .env.example .env   # export the variables, or use your own loader
npm run seed
npm run dev
```

Without `ANTHROPIC_API_KEY`, `summarize_article` uses a local extractive summary.
If the LLM call fails or times out, it falls back the same way.

## Connect to a client

Claude Code:

```bash
claude mcp add editor-content -- npx tsx /absolute/path/to/editor-content-mcp/src/index.ts
```

Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "editor-content": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/editor-content-mcp/src/index.ts"],
      "env": { "MONGODB_URI": "mongodb://localhost:27017", "REDIS_URL": "redis://localhost:6379" }
    }
  }
}
```

## Design notes

- stdio transport: logs go to stderr only, stdout is reserved for the protocol.
- Tool inputs are validated with zod. Unknown article ids return an MCP error result, not a crash.
- Redis failures are logged and ignored, so a cache outage never breaks a tool call.
- Repository and cache are interfaces, so tests run without MongoDB or Redis.

## Tests

```bash
npm test
```
