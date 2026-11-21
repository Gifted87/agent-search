# AgentSearch

Fast, open-source AI agent search engine & aggregator. 17 high-performance endpoints, built-in interactive Exa-style Web UI, 10-layer cascading content extraction with ephemeral browser rendering, and optional Tor-anonymized stack. No third-party search API keys, no per-query fees, and zero vendor lock-in.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python: 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![SearXNG](https://img.shields.io/badge/SearXNG-Integrated-00ADEF)](https://github.com/searxng/searxng)
[![PyPI](https://img.shields.io/pypi/v/agentsearch-client)](https://pypi.org/project/agentsearch-client/)

---

## Quickstart (Docker Compose)

```bash
git clone https://github.com/Gifted87/agent-search.git
cd agent-search
./scripts/prepare-searxng.sh
docker compose up -d
curl "http://localhost:3939/search?q=distributed+consensus+algorithms"
```

You now have a deduplicated, multi-engine search API running on `:3939`.

Open `http://localhost:3939` in your browser to access the built-in **Exa-style Search & Extraction UI**.

If you enable authentication, pass the token on all non-health endpoints:

```bash
export AGENT_SEARCH_TOKEN="change-me"
curl -H "Authorization: Bearer $AGENT_SEARCH_TOKEN" \
  "http://localhost:3939/search?q=distributed+consensus+algorithms"
```

Prefer native local development without Docker for the API server?

```bash
git clone https://github.com/Gifted87/agent-search.git
cd agent-search
./scripts/install-native.sh
./scripts/run-native.sh
```

Native mode requires Python 3.11+ and a reachable SearXNG instance with JSON output enabled. It stores AgentSearch state in `./data`. See [Native Install](docs/native-install.md).

---

## Interactive Web UI

AgentSearch ships with a client-agnostic, dark-mode Web UI served at the root (`/`):

- **Search Playground**: Live neural and keyword search with real-time scoring, query expansion (deep search), domain trust badges, and inline content preview.
- **Reader & Extraction Studio**: Test 10-layer cascading extraction or browser rendering on any arbitrary URL with instant preview of clean text, metadata, and strategy provenance.
- **Engines & Health Telemetry**: Live dashboard showing upstream SearXNG status, direct vertical provider health, latency, and error tracking.

---

## Why AgentSearch?

Raw search engines find URLs; AI agents require structured, reliable context. AgentSearch wraps [SearXNG](https://github.com/searxng/searxng) with an intelligent FastAPI orchestration layer that adds everything LLM agents need:

- **Multi-Engine Fusion**: Aggregate and cross-score results from Bing, Google, DuckDuckGo, Brave, Qwant, Mojeek, Yahoo, and specialized vertical engines.
- **No API Keys or Cost**: Completely self-hosted; replaces expensive per-query APIs like Tavily ($0.005/query) or Exa ($0.001/query).
- **10-Layer Cascading Content Extraction**: Automatically falls back across 10 extraction strategies (direct selectors, readability, user-agent rotation, headless browser rendering, Wayback CDX, Google Cache, etc.).
- **Security & Scrubber**: Built-in SSRF protection, prompt injection detection, and content sanitization to prevent adversarial context poisoning.
- **Query Expansion**: Deep search executes multi-vector query variations in parallel and fuses the results.
- **Privacy & Anonymity**: Optional Tor + Snowflake + CoreDNS DoT routing stack for private, ISP-isolated agent operations.

| Feature | AgentSearch | Tavily | Exa | SerpAPI | Raw SearXNG |
|---|---|---|---|---|---|
| **Cost** | **Free / Self-Hosted** | $0.005/query | $0.001/query | $50/mo+ | Free |
| **Self-hosted** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Interactive UI** | ✅ (Built-in) | ❌ | ✅ | ❌ | ✅ (Search only) |
| **10-Layer Extraction** | ✅ (Cascading + Browser) | Basic | Basic | ❌ | ❌ |
| **Deduplication & Fusion** | ✅ Cross-engine | ❌ | ❌ | ❌ | ❌ |
| **Prompt Injection Scrubber** | ✅ Built-in | ❌ | ❌ | ❌ | ❌ |
| **Adaptive Failure Analysis** | ✅ (Evolver engine) | ❌ | ❌ | ❌ | ❌ |
| **Tor Anonymization** | ✅ Optional stack | ❌ | ❌ | ❌ | Manual |

---

## Architecture & Multi-Engine Routing

AgentSearch coordinates two retrieval tiers:
1. **SearXNG Broad-Web Tier**: Metasearch routing queries across Google, Bing, Brave, DuckDuckGo, Qwant, Startpage, Mojeek, and Yahoo.
2. **Direct No-Key Vertical Tier**: Direct connectors to specialized APIs including GitHub, MDN, Docker Hub, PyPI, Wikipedia, Wikidata, Hacker News, arXiv, Crossref, OpenAlex, and Semantic Scholar.

```
Port 3939 (Direct API + Web UI)               Port 3940 (Tor-Anonymized Stack)
              │                                                │
              ▼                                                ▼
┌───────────────────────────┐                    ┌───────────────────────────┐
│     FastAPI Application   │                    │     FastAPI Application   │
│  - Static Web UI (Exa)    │                    │  - Same Engine Logic      │
│  - Cross-Engine Dedup     │                    │  - Tor Egress Only        │
│  - Query Expansion (Deep) │                    └─────────────┬─────────────┘
│  - 10-Layer Extraction    │                                  │
│  - Scrubber & Trust Score │                                  ▼
└──────────────┬────────────┘                    ┌───────────────────────────┐
               │                                 │     SearXNG (Private)     │
       ┌───────┴───────┐                         │   (tor-internal network)  │
       ▼               ▼                         └─────────────┬─────────────┘
┌──────────────┐ ┌──────────────────────────┐                  │
│   SearXNG    │ │ Direct Vertical Sources  │                  ▼
│ Broad Search │ │ arXiv, GitHub, MDN, PyPI │         ┌─────────────────┐
│ Bing, Google │ │ Wikipedia, OpenAlex, HN  │         │   Tor Proxy     │
│ Brave, Qwant │ └──────────────────────────┘         │ Snowflake+obfs4 │
└──────┬───────┘                                      └────────┬────────┘
       │                                                       │
       ▼                                                       ▼
┌──────────────┐                                       ┌────────────────┐
│   Internet   │                                       │ Secure Egress  │
└──────────────┘                                       └────────────────┘
```

The live list of enabled engines on your running instance is always available at:

```bash
curl "http://localhost:3939/engines"
```

---

## API Reference & Endpoints

### 1. Search Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/search` | `GET` | Core multi-engine web search with deduplication and cross-engine ranking |
| `/search/strategy` | `GET` | Domain-specific modes (`general`, `code`, `academic`, `news`, `reference`, `community`, `private`) |
| `/search/deep` | `GET` | Server-side query expansion — generates parallel variations and fuses rankings |
| `/search/extract` | `GET` | Combined search + instant inline content extraction (single round-trip) |
| `/search/jobs` | `GET` | Aggregated job postings across LinkedIn, Indeed, Glassdoor, and ZipRecruiter |
| `/search/policy` | `GET` | Policy, legislative, and regulatory document search |
| `/search/sources` | `GET` | Institutional source discovery and registry filtering |
| `/search/sources/institutions`| `GET` | List institutional source registry |
| `/search/stats` | `GET` | Query statistics, latency tracking, and cache hit metrics |
| `/news` | `GET` | Multi-source curated news with reliable defaults |

### 2. Content Extraction & Reader

| Endpoint | Method | Description |
|---|---|---|
| `/read` | `GET` | Cascading 10-layer extraction for any target URL |
| `/read/batch` | `POST` | Concurrent batch extraction for multiple URLs |
| `/providers/browser/fetch` | `GET` | Ephemeral browser render/extract for JavaScript-heavy dynamic pages |

#### Cascading Extraction Chain:
1. **Direct HTTP Fetch**: Fast response with heuristic content selectors.
2. **Readability Scoring**: Text/link density parsing.
3. **User-Agent Rotation**: Modern Chrome/Safari/Firefox/Edge TLS fingerprints.
4. **Browser Renderer**: Headless rendering for JS-rendered DOMs.
5. **Wayback Machine**: CDX API → latest snapshot fallback.
6. **Google Cache**: Historical cache recovery.
7. **Search-About Fallback**: Multi-engine search for duplicate/syndicated coverage.
8. **Custom Adapters**: Pluggable Python modules in `adapters/` (e.g. Medium, Cloudflare bypass).
9. **PDF Extraction**: Embedded document parsing via `pdfplumber`.
10. **YouTube Transcripts**: Full automated transcript extraction via `yt-dlp`.

### 3. Adaptation & Telemetry

| Endpoint | Method | Description |
|---|---|---|
| `/adapt/report` | `POST` | Log extraction failures to train adaptation heuristics |
| `/adapt/stats` | `GET` | Inspect failure patterns, error rates, and domain metrics |
| `/adapt/evolve` | `POST` | Trigger adaptation cycle to auto-tune extraction configs |
| `/health` | `GET` | System health check (API status, SearXNG reachability) |
| `/engines` | `GET` | List all upstream engine statuses |
| `/providers/health` | `GET` | Live telemetry summary of direct and SearXNG providers |
| `/providers/stats` | `GET` | Real-time provider attempt metrics, latency, and error logs |

---

## Usage Examples

### Search with Inline Content Extraction

```bash
curl "http://localhost:3939/search/extract?q=python+asyncio+taskgroup&count=3"
```

### Specialized Strategy Search

```bash
# Code search (GitHub, MDN, Docker Hub, PyPI)
curl "http://localhost:3939/search/strategy?q=fastapi+websocket+auth&mode=code&count=5"

# Academic research (arXiv, Crossref, OpenAlex, Semantic Scholar)
curl "http://localhost:3939/search/strategy?q=sparse+attention+transformers&mode=academic&count=5"

# Reference documentation (Wikipedia, Wikidata)
curl "http://localhost:3939/search/strategy?q=Raft+consensus&mode=reference&count=5"
```

### Deep Search (Query Expansion)

```bash
curl "http://localhost:3939/search/deep?q=autonomous+agent+memory+architectures&count=10"
```

### Read URL via Cascading Extraction

```bash
curl "http://localhost:3939/read?url=https://news.ycombinator.com"
```

Response:
```json
{
  "url": "https://news.ycombinator.com",
  "content": "Cleaned readable text extracted from target...",
  "strategy": "direct",
  "chars": 3412,
  "cached": false,
  "strategies_tried": ["direct"]
}
```

### Batch Extraction

```bash
curl -X POST "http://localhost:3939/read/batch" \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://en.wikipedia.org/wiki/Search_engine", "https://arxiv.org/abs/2301.00001"]}'
```

---

## Client Integration

### Python SDK

```bash
pip install agentsearch-client
```

```python
from agentsearch import AgentSearch

client = AgentSearch(base_url="http://localhost:3939")

# 1. Search
results = client.search("autonomous coding agents", count=5)
for r in results.results:
    print(f"[{r.score:.2f}] {r.title} -> {r.url}")

# 2. Extract content
doc = client.read("https://example.com/blog-post")
print(doc.content[:300])

# 3. Dynamic browser rendering for client-side apps
rendered = client.browser_fetch("https://example.com/spa-dashboard")
print(rendered.title, len(rendered.links))
```

### LangChain / LlamaIndex / Agent Framework Tool

```python
from langchain.tools import tool
import requests

@tool
def agent_search(query: str) -> str:
    """Search the web using self-hosted AgentSearch."""
    response = requests.get("http://localhost:3939/search", params={"q": query, "count": 5})
    results = response.json().get("results", [])
    return "\n\n".join(f"Title: {r['title']}\nURL: {r['url']}\nSnippet: {r['snippet']}" for r in results)
```

### MCP Server (Claude Desktop, Cursor, Windsurf)

AgentSearch includes a first-class Model Context Protocol (MCP) server:

```bash
pip install mcp httpx
python mcp-server/server.py
```

Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "agent-search": {
      "command": "python",
      "args": ["/path/to/agent-search/mcp-server/server.py"]
    }
  }
}
```

---

## Private Stack (Tor + Encrypted DNS)

For sensitive agent workflows requiring complete anonymity:

```
┌──────────┐    ┌──────────────┐    ┌───────────────┐    ┌──────────┐
│  :3940   │───▶│ api-private  │───▶│ searxng-priv  │───▶│   Tor    │──▶ Internet
│ (agent)  │    │ (FastAPI)    │    │ (SearXNG)     │    │(Snowflake│
└──────────┘    └──────────────┘    └───────────────┘    │ + obfs4) │
                                                         └──────────┘
                 All containers use CoreDNS → Cloudflare DoT
                 tor-internal network: no direct egress possible
```

Start the private stack:

```bash
./scripts/prepare-searxng.sh
docker compose -f docker-compose.yml -f examples/compose.private.yml up -d --build
```

- Direct search API: `http://localhost:3939`
- Tor-anonymized search API: `http://localhost:3940`

---

## Configuration

| Variable | Default | Description |
|---|---|---|
| `SEARXNG_URL` | `http://searxng:8080` | Internal URL to SearXNG backend |
| `CACHE_TTL` | `3600` | Search & extraction cache lifetime in seconds |
| `RATE_LIMIT` | `60` | Max requests per minute per client IP |
| `AGENT_SEARCH_TOKEN` | `""` | Optional shared bearer token for API authentication |
| `ADAPTERS_DIR` | `/app/adapters` | Directory containing custom extraction adapters |
| `SQLITE_TIMEOUT` | `1.0` | SQLite lock wait timeout in seconds |
| `FETCH_LOG_RETENTION_DAYS` | `30` | Days to retain fetch telemetry records |
| `QUERY_LOG_RETENTION_DAYS` | `30` | Days to retain search query analytics |

---

## Development & Testing

```bash
# Set up Python environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt pytest requests
pip install -e sdk -e mcp-server

# Prepare SearXNG configuration
./scripts/prepare-searxng.sh

# Run offline unit test suite (mocks SearXNG)
pytest tests -q

# Run with integration tests against local instance
AGENTSEARCH_INTEGRATION=1 pytest tests -q
```

---

## Contributing & License

Contributions are welcome! Please open an issue or submit a pull request.

- The core **AgentSearch API, SDK, Docker stack, and documentation** are licensed under the [MIT License](LICENSE).
- The **MCP server** (`mcp-server/`) is licensed under the [AGPL-3.0 License](mcp-server/LICENSE).
