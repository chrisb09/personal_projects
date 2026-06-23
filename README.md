# Developer Portfolio Website

A high-performance, responsive personal developer portfolio built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**. 

All content (including projects, links, and layout headings) is driven dynamically by local configuration files, making it easy to maintain without editing codebase components directly.

---

## Getting Started

### 1. Installation
Install project dependencies using `npm`:
```bash
npm install
```

### 2. Run the Development Server
Starts the Vite local development server:
```bash
npm run dev
```

### 3. Build for Production
Compiles the database assets and bundles the application for static hosting:
```bash
npm run build
```

---

## Folder Configuration

Rather than being hardcoded in code, your portfolio settings and project entries are defined in the `/config` directory at the project root:

1. **Header & Contact Buttons**: Configured in [config/portfolio-header.json](file:///home/christian/git/personal_projects/config/portfolio-header.json). Controls the landing page badge, title text, description, and list of external social links (GitHub, GitLab, LinkedIn, etc.) displayed in the header and footer.
2. **Project Entries**: Located in [config/projects/](file:///home/christian/git/personal_projects/config/projects/). Each project is defined as a directory containing a `project.json` file, an optional `media/` folder (for screenshots), and an optional `logo.<ext>` image (for project logo). 

For details on the project metadata fields, see [PROJECTS_GUIDE.md](file:///home/christian/git/personal_projects/PROJECTS_GUIDE.md).

---

## Compilation & Automation Scripts

The project includes several utilities to compile data and pull external stats:

* **Compile Projects (`npm run compile-projects`)**: Reads the `config/projects/` folder, processes images/logos, and builds the static configuration script in the code.
* **Auto-Compiler Watcher (`npm run watch-projects`)**: Monitors the `config/projects/` folder for live edits and compiles changes automatically.
* **Update Git Stats (`npm run update-stats`)**: Fetches stars, commit counts, branches, and lines of code breakdown from GitHub and GitLab APIs. 
  *(Configure `GITHUB_TOKEN` and `GITLAB_TOKEN` to query private repositories or bypass rate limits).*

---

## Docker Deployment

You can deploy the portfolio website locally or on a server using the provided multi-container Docker Compose setup. It automatically handles config watching, statistics updating, and serving built assets.

### 1. Services Overview
* **`portfolio-web` (Nginx)**: Serves the compiled production static assets on port `8080`.
* **`portfolio-builder` (Node.js)**: Runs in the background to handle:
  - **Initial Build**: Compiles configurations and builds the production site on startup.
  - **Config Watcher**: Automatically detects edits in the `./config` folder and rebuilds the site 10 seconds after changes stop.
  - **Stats Scheduler**: Periodically runs `npm run update-stats` to fetch Git stats and rebuilds the site with the latest stats. Persists `stats.json` and images back to your host machine's `./public` folder.

### 2. How to Run
Spin up the containers in detached mode:
```bash
docker-compose up --build -d
```
Access the portfolio at `http://localhost:8080`.

### 3. Environment Variables
Configure these in your environment or directly inside `docker-compose.yml`:
* `GITHUB_TOKEN`: GitHub personal access token to query private repositories and increase API rate limits.
* `GITLAB_TOKEN`: GitLab personal access token.
* `STATS_UPDATE_INTERVAL_HOURS`: How often (in hours) the statistics updater runs. Defaults to `6`.

