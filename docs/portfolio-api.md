# Portfolio API and MCP

Read-only REST and Model Context Protocol access to the portfolio project catalog, documents, media, statistics, private repositories and personal context documents.

The service is intended for internal use. It returns full project and repository data, including private repository URLs and author metadata. It still refuses to read credential files such as `.env`, SSH keys, `.git/config`, archives and binaries.

## Service

| Item | Value |
|---|---|
| Container | `portfolio-api` |
| Internal port | `3002` |
| REST base | `https://projects.christian-f-brinkmann.de/api/portfolio/v1` |
| MCP endpoint | `https://projects.christian-f-brinkmann.de/mcp` |
| Auth | HTTP Basic |
| Data access | read-only mounts |

The service mounts:

```
/app/config              project metadata and translations
/app/public              published documents, images, stats and activity
/app/repos               private repository clones
/app/extra-repos         unlisted repository clones
/app/context             personal bio/career/notes
/app/data/repo-summaries pre-computed codebase summaries
```

It does **not** mount `/data/backups`.

## Authentication

Set one or more Basic-auth users on the server:

```bash
PORTFOLIO_API_USER=portfolio
PORTFOLIO_API_PASSWORD=<random-password>
```

Or use a JSON map with scopes:

```bash
PORTFOLIO_API_USERS='{"portfolio":{"password":"<random>","scope":"private"},"public":{"password":"<random>","scope":"public"}}'
```

A `private` user can access everything. A `public` user can access the portfolio catalog, documents, media, stats, profile and activity, but not repositories or personal context.

The API refuses to start without credentials unless `PORTFOLIO_API_ALLOW_ANONYMOUS=1` is set for local development.

| Variable | Default | Purpose |
|---|---|---|
| `PORTFOLIO_API_USER` | — | Basic-auth username |
| `PORTFOLIO_API_PASSWORD` | — | Basic-auth password |
| `PORTFOLIO_API_USERS` | — | JSON map of users and scopes |
| `PORTFOLIO_API_PUBLIC_BASE_URL` | `https://projects.christian-f-brinkmann.de` | Base URL used in returned links |
| `PORTFOLIO_API_RATE_LIMIT_PUBLIC` | `300` | Requests per minute for public users |
| `PORTFOLIO_API_RATE_LIMIT_PRIVATE` | `600` | Requests per minute for private users |
| `PORTFOLIO_API_ALLOW_ANONYMOUS` | `0` | Allow unauthenticated public access (local development only) |

### curl

```bash
curl -u portfolio:<password> \
  https://projects.christian-f-brinkmann.de/api/portfolio/v1/projects
```

### OpenCode

Add the MCP server to the OpenCode configuration on the client machine:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "portfolio": {
        "type": "remote",
        "url": "https://projects.christian-f-brinkmann.de/mcp",
        "oauth": false,
        "headers": {
          "Authorization": "Basic {env:PORTFOLIO_MCP_BASIC}"
        }
      }
    }
  }
}
```

An example file is available at [docs/opencode-mcp-config.example.json](opencode-mcp-config.example.json).

`PORTFOLIO_MCP_BASIC` is the base64 encoding of `user:password`:

```bash
printf '%s' 'portfolio:<password>' | base64 -w0
```

Set it in the environment that launches OpenCode. Then run:

```bash
opencode mcp list
```

The server should appear as `portfolio connected`.

## REST endpoints

All endpoints require Basic auth except `/health`.

### Public data

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Minimal unauthenticated health check |
| `GET` | `/api/portfolio/v1/health` | Detailed health, auth summary and counts |
| `GET` | `/api/portfolio/v1/profile` | Portfolio header, tagline, description and contact links |
| `GET` | `/api/portfolio/v1/projects` | List projects; filters: `q`, `category`, `status`, `technology`, `role`, `sourceType`, `aiUsage`, `lang`, `limit`, `offset` |
| `GET` | `/api/portfolio/v1/projects/:id` | Full project metadata, documents, assets, stats and links |
| `GET` | `/api/portfolio/v1/projects/:id/documents` | Document manifest |
| `GET` | `/api/portfolio/v1/projects/:id/documents/:file` | Download a document |
| `GET` | `/api/portfolio/v1/projects/:id/documents/:file/text` | Extracted text; `offset`, `maxChars`, `page` |
| `GET` | `/api/portfolio/v1/projects/:id/assets` | Logo and screenshot URLs |
| `GET` | `/api/portfolio/v1/stats` | Full `stats.json` |
| `GET` | `/api/portfolio/v1/stats/:id` | One project’s stats and per-repository details |
| `GET` | `/api/portfolio/v1/activity` | Git activity calendar |
| `GET` | `/api/portfolio/v1/search?q=...` | Search project metadata and document text |

### Private data

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/portfolio/v1/repos` | List cloned repositories |
| `GET` | `/api/portfolio/v1/repos/:repo/files?path=` | List files and folders |
| `GET` | `/api/portfolio/v1/repos/:repo/file?path=&start=&lines=` | Read a text file |
| `GET` | `/api/portfolio/v1/repos/:repo/search?q=` | Search code |
| `GET` | `/api/portfolio/v1/repos/:repo/git/log?limit=` | Recent commits |
| `GET` | `/api/portfolio/v1/repos/:repo/git/commit/:ref` | Commit stat and diff |
| `GET` | `/api/portfolio/v1/repos/:repo/git/contributors` | Contributors |
| `GET` | `/api/portfolio/v1/repos/:repo/summary` | Pre-computed codebase summary |
| `GET` | `/api/portfolio/v1/repos/:repo/image?path=` | Image from a repository |
| `GET` | `/api/portfolio/v1/context` | Personal context catalog |
| `GET` | `/api/portfolio/v1/context?name=...` | Read a context document |

## MCP tools

OpenCode exposes the tools as `portfolio_<tool>`.

### Public tools

| Tool | Description |
|---|---|
| `list_projects` | List and filter projects |
| `get_project` | Full project details |
| `list_documents` | List documents for one or all projects |
| `read_document` | Read Markdown or extracted PDF text |
| `get_assets` | Logo and screenshot URLs |
| `search` | Search projects and document text |
| `get_profile` | Portfolio profile and contact links |
| `get_stats` | Full or per-project statistics |
| `get_activity` | Git activity calendar |

### Private tools

| Tool | Description |
|---|---|
| `list_repos` | List cloned repositories |
| `list_repo_files` | List repository files |
| `read_repo_file` | Read a repository text file |
| `search_repo_code` | Search code |
| `get_git_log` | Recent commits |
| `get_git_commit_diff` | Commit stat and diff |
| `get_git_contributors` | Contributors |
| `get_codebase_summary` | Pre-computed codebase summary |
| `find_repo_images` | Find images in a repository |
| `read_context` | List or read personal context documents |

### Resources

```
portfolio://profile
portfolio://projects
portfolio://projects/{projectId}
portfolio://projects/{projectId}/documents
portfolio://projects/{projectId}/documents/{file}
portfolio://stats
portfolio://activity
portfolio://repos
portfolio://context
```

## Document text

- Markdown is returned as UTF-8 text.
- PDFs are converted with `pdftotext -layout`, with page markers and a page count.
- The default text cap is 40,000 characters; use `offset`/`nextOffset` to page through.
- `page` extracts a single PDF page.
- Every document response includes the public download URL and the authenticated API URL.

## Deployment

```bash
docker-compose build portfolio-api
docker-compose up -d portfolio-api
cp nginx.conf /container/config/personal_projects/nginx.conf
docker exec portfolio-web nginx -t
docker exec portfolio-web nginx -s reload
nginx -t && systemctl reload nginx
```

The host nginx pins `/mcp` and `/api/portfolio/` to `127.0.0.1:8482`, so the laptop test upstream cannot shadow the API. The normal website keeps the existing failover behavior. Add these blocks to the `projects.christian-f-brinkmann.de` server:

```nginx
location /mcp {
    proxy_pass http://127.0.0.1:8482;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 1m;
}

location /api/portfolio/ {
    proxy_pass http://127.0.0.1:8482;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 1m;
}
```

## Security notes

- The service is read-only.
- Paths are resolved with `realpath` and must stay inside the configured roots.
- `.env`, SSH keys, `.git/config`, private keys, archives and binaries are blocked.
- Credentials are never logged.
- Rate limits: 300 requests/minute for public users, 600 for private users.
- The container runs with `no-new-privileges`.
- Basic auth must be used over HTTPS.
