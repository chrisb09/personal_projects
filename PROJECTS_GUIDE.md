# Projects Configuration and Compilation Guide

This guide details how projects are structured, configured, and compiled in this portfolio, as well as how to run automatic watchers and collect live statistics.

---

## 1. Directory Structure

Rather than being hardcoded inside the web application source code, all project data is kept in the `projects/` directory at the root of the workspace.

There are two supported formats for defining a project:

### A. File-based (No Media Assets)
If a project only has text metadata and does not require local images/screenshots, define it as a single JSON file:
```
projects/your-project-id.json
```

### B. Directory-based (With Media Assets)
If a project has screenshots or local images, define it as a folder named after the project ID:
```
projects/your-project-id/
├── project.json   # Holds the text metadata
└── media/         # Place screenshots here (e.g. screenshot1.jpg, screenshot2.png)
```
During compilation, all images inside the `media/` directory are automatically copied into the web structure (`public/images/projects/your-project-id/`), and the `screenshots` array in the compiled config is dynamically updated to reference their public web URLs.

### C. Logo Auto-Resolution
You can associate a custom logo icon (supported: `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`) with any project:
- **File-based projects**: Place an image file with the same name as the project ID in the `projects/` directory (e.g. `projects/pdnwebview.png`).
- **Directory-based projects**: Place an image file named `logo.<ext>` inside the project folder (e.g. `projects/filament-spool-holder/logo.png`).

During compilation, these logo files are copied to the public directory and the compiled project `logo` field is automatically set to `/images/projects/<your-project-id>-logo.<ext>` or `/images/projects/<your-project-id>/logo.<ext>` respectively.

---

## 2. Supported Fields in Project Metadata

Each project JSON file (either `projects/<id>.json` or `projects/<id>/project.json`) supports the following fields:

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | **Required.** Unique identifier matching the filename or folder name. |
| `name` | `string` | **Required.** The human-readable name of the project. |
| `tagline` | `string` | **Required.** A short, catchy 1-sentence tagline. |
| `year` | `string` | **Required.** The active development year(s) (e.g. `"2024"`, `"2018 - Present"`). |
| `category` | `string` | **Required.** Technical category. Supported: `backend`, `frontend`, `devops-infrastructure`, `data-scraping`, `library`, `package-management`, `cli`, `fullstack`, `utility`, `other`. |
| `status` | `string` | **Required.** Lifecycle status. Supported: `active`, `experimental`, `maintenance`, `archived`. |
| `projectType` | `string` | **Required.** Main landing page category. Supported: `software-project`, `script-small`, `3d-printing`, `it-project`. |
| `excludeFromStats` | `boolean` | *Optional.* Set `true` to exclude this project from dynamic API stats fetching (useful if a Git instance blocks queries or is private). |
| `role` | `string` | **Required.** Your role: `main-author`, `contributor`, `fork-maintainer`. |
| `sourceType` | `string` | **Required.** Source visibility: `open-source`, `closed-source`. |
| `aiUsage` | `string` | **Required.** AI coding assistance: `none` (No AI), `minor` (AI Assisted), `major` (AI Generated), `full` (AI Built). |
| `aiUtilization` | `string` | **Required.** Product AI features: `ai-powered` (Core AI features), `ai-enhanced` (Some AI features), `no-ai` (No AI features). |
| `description` | `string` | **Required.** Multi-paragraph overview of what the project does. |
| `purpose` | `string` | **Required.** The business goal or problem this project solved. |
| `technologies` | `string[]` | **Required.** List of key languages/frameworks (e.g. `["React", "TypeScript"]`). |
| `dependencies` | `string[]` | **Required.** Key libraries or runtime environment requirements. |
| `expertise` | `string[]` | **Required.** Mechanical or software expertise fields highlighted. |
| `strengths` | `string[]` | **Required.** List of key achievements or strengths. |
| `limitations` | `string[]` | **Required.** List of limitations or known trade-offs. |
| `installation` | `string` | *Optional.* Multi-line code block of installation command sequences. |
| `usage` | `string` | *Optional.* Multi-line code block of usage commands. |
| `roadmap` | `string[]` | **Required.** Future work and roadmap items. |
| `demoUrl` | `string` | *Optional.* URL to a live website or demo page. |
| `docsUrl` | `string` | *Optional.* Link to a documentation page. |
| `logo` | `string` | *Optional.* Path to custom icon/logo (e.g. `/images/projects/my-logo.png`). |
| `repos` | `object[]` | List of primary repositories. Element schema: `{ "name": "slug", "url": "https://...", "type": "github" \| "gitlab" }`. |
| `mirrors` | `object[]` | List of mirrors (same schema as `repos` with an optional `"description"` field). |
| `relatedProjects` | `object[]` | List of related work. Schema: `{ "name": "Name", "relation": "Description", "url": "https://...", "projectId": "other-project-id" }`. |
| `stats` | `object` | *Optional.* Static fallback for Git stats (same schema as stats.json) if repo is offline. |
| `loc` | `object` | *Optional.* Static fallback for LOC breakdown if repo is offline. |

---

## 3. Compilation Scripts

We have provided two scripts to compile the `projects/` data into the React app:

### A. One-Time Compilation
Combines all project definitions, copies media files, and generates `src/config/projects.ts`:
```bash
npm run compile-projects
```
> **Note**: This is automatically executed as part of `npm run build` so that production builds are always up to date.

### B. Auto-Compiler Watcher
Watches the `projects/` directory recursively. When a file is added, edited, or deleted, it schedules a compilation task **10 seconds** in the future. If another edit occurs during this 10-second window, the timer resets, preventing redundant rebuilds:
```bash
npm run watch-projects
```

---

## 4. Live Statistics Collection

Run the statistics collector script to query Git hosting APIs for stars, commits, branches, pushing dates, and LOC breakdowns, saving them into `public/stats.json`:
```bash
npm run update-stats
```

### Authentication & Token Configuration
To prevent API rate limit issues and download metrics for private repositories, configure the following environment variables:

1. **GitHub Auth**:
   - Variable name: `GITHUB_TOKEN`
   - Value: Personal Access Token with `repo` scope.

2. **GitLab Auth (Multi-Instance support)**:
   - If you use multiple GitLab instances (e.g., public GitLab.com and a private company server), you can configure unique tokens for each host.
   - The script converts the GitLab instance host into a valid environment variable name: **`GITLAB_TOKEN_<HOST_UPPERCASE_WITH_UNDERSCORES>`**.
   - **Examples**:
     - `gitlab.com` $\rightarrow$ `GITLAB_TOKEN_GITLAB_COM`
     - `gitlab.instance2.com` $\rightarrow$ `GITLAB_TOKEN_GITLAB_INSTANCE2_COM`
   - If an instance-specific variable is not defined, it falls back to the default `GITLAB_TOKEN`.
