# Graphiti and local graphs

Codech has two distinct graph surfaces:

1. A local source import graph and linked-Markdown graph, which need no inference account or database.
2. An optional Graphiti semantic memory service for extracted entities, temporally scoped facts and provenance.

The 0.1 Graphiti adapter implements Streamable HTTP MCP initialization, tool discovery and project-scoped `search_memory_facts`. Open **Graph → Connect local service** after starting the service, then **Search project memory**. The group ID is `codech_` followed by the first 16 characters of a SHA-256 digest of the absolute project path. Use the displayed group ID for reviewed ingestion into that project. Moving a project currently changes this ID; persistent project IDs are planned.

Default endpoint: `http://127.0.0.1:8000/mcp/`. Change `codech.graphitiUrl` for another loopback port. Remote endpoints are intentionally rejected. This adapter does not yet ingest notes automatically, add facts to every agent prompt, manage Docker, or draw a full Graphiti entity graph.

## Run the optional service

Follow the current upstream [Graphiti MCP instructions](https://github.com/getzep/graphiti/tree/main/mcp_server). Clone it separately and pin a reviewed version/commit. The upstream repository includes a combined FalkorDB + MCP Docker Compose setup. Configure the required LLM and embedding provider and start that setup, keeping host ports bound to loopback. Do not commit API keys or credentials into the Codech repository.

The upstream reference server has no authentication or authorization. Codech only connects to loopback, but local processes can still reach an unprotected local server. Use it for local development; production multi-user memory needs an authenticated service with per-project permissions. This is a concrete limitation of the selected reference integration.

ChatGPT sign-in for the coding agent does not automatically fund or authenticate Graphiti's entity extraction and embeddings. Graphiti needs its own supported provider configuration. Upstream also documents local Ollama-compatible LLMs and Sentence Transformers embeddings; hardware requirements and extraction quality must be tested. Codech does not silently turn on a paid background ingestion service.

For Codex-driven semantic retrieval, configure the supported Graphiti MCP endpoint in the isolated Codech Codex configuration following the official Codex MCP docs. This version's built-in Graphiti buttons are an independent read-only adapter; automatic MCP configuration and tool policy are roadmap items.
