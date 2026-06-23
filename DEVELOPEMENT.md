# Development Log & Session Summary

This document outlines the architecture of the portfolio repository and summarizes the design decisions, tasks, and changes implemented during this development session.

---

## 1. Project Overview & Architecture
This repository contains a responsive, high-performance developer portfolio website built with **React 19**, **TypeScript**, **Vite 5**, and **Tailwind CSS 3**.

### Key Architectural Concepts:
* **Configuration-Driven Content**: Project details, categories, roles, and status fields are not hardcoded. Instead, they are defined in `/config/projects/` as JSON folders (optionally containing logos and screenshot media).
* **Compilation Pipeline**:
  - The script `scripts/compile-projects.js` reads the configuration directory, copies project logos and screenshots to `/public/images/projects`, and compiles a static array in `src/config/projects.ts`.
  - The watcher script `scripts/watch-projects.js` monitors `./config/projects/` for live updates and automatically recompiles configs.
* **API Git Stats Collection**:
  - The script `scripts/update-stats.js` analyzes local clones of Git repositories in `/repos/` to compute lines of code (LOC) by language and commit counts.
  - It saves results dynamically into `public/stats.json`, which is fetched by the website frontend at runtime.

---

## 2. Session Summary & Tasks Completed
During this session, we completed the following updates:

### Project Content & Metadata Adjustments
1. **`ibus` Status Update**: Changed the status of the `ibus` project to `"archived"` (previously `"completed"`) in [config/projects/ibus/project.json](file:///app/config/projects/ibus/project.json).
2. **`cycling-power-estimator` Live Demo**: Added the live site URL (`https://gpx.christian-f-brinkmann.de`) to the project metadata in [config/projects/cycling-power-estimator/project.json](file:///app/config/projects/cycling-power-estimator/project.json) using the `liveUrl` key.
3. **`php-autoindexed-file-viewer` Reclassification**: Changed the project type from `"software-project"` to `"script-small"` in [config/projects/php-autoindexed-file-viewer/project.json](file:///app/config/projects/php-autoindexed-file-viewer/project.json), moving it under "Scripts and Small Projects".

### Docker Setup for Local Hosting & Dynamic Updating
To support local hosting and keep the static site updated in real-time when project folders or statistics change, we designed a two-container Docker Compose pipeline:
1. **`portfolio-web` (Nginx)**: Runs on `nginx:alpine` to serve compiled assets with custom rules in [nginx.conf](file:///app/nginx.conf) (supporting client-side SPA routing and Gzip compression). It reads assets from a shared volume `portfolio-dist`.
2. **`portfolio-builder` (Node.js)**: Runs in the background and is bound to host directories (`config`, `repos`, `public`, `src`).
   - Runs `npm run build` on startup to populate the shared volume.
   - Monitors the host's `config/` folder using the watcher and builds Vite assets 10 seconds after changes stop.
   - Spawns `scripts/stats-scheduler.js` to run the stats collector every 6 hours and write results back to the host's `public/stats.json`, then automatically rebuilds the site.
3. **Optimized Context Size**: Added [.dockerignore](file:///app/.dockerignore) to ignore `node_modules/` and cloned `repos/`, reducing context transfer size from ~1 GB to 7.4 MB.

### Code & Script Refactoring
* **`scripts/watch-projects.js`**: Refactored to read an optional `WATCH_BUILD_CMD` env var. In Docker, it runs `npm run build` instead of just compiling projects, allowing changes to bubble up to Nginx instantly.
* **`scripts/stats-scheduler.js`**: New scheduler script running stats updates and trigger-building the site on a periodic loop.
* **`scripts/docker-entrypoint.js`**: Synchronizes initial compilation/build before launching background watcher and scheduler.

---

## 3. How to Develop and Deploy

### Local Development (Host Machine)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run Vite dev server + watcher:
   ```bash
   npm run dev
   npm run watch-projects
   ```

### Running with Docker (Dynamic Build & Serve)
Start the multi-container stack:
```bash
docker-compose up --build -d
```
* Edits to project JSON configurations in `config/projects/` will be watched, compiled, and compiled assets served by Nginx without restarting.
* Clones in `repos/` can be analyzed inside the container (which has `git` pre-installed). Provide your tokens via environment variables for `update-stats` authentication:
  ```bash
  GITHUB_TOKEN=your_token GITLAB_TOKEN=your_token docker-compose up -d
  ```
