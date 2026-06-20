# Developer Portfolio Website

A high-performance, responsive personal developer portfolio built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**. 

All content (including projects, links, and layout headings) is driven dynamically by local configuration files, making it easy to maintain without editing codebase components directly.

---

## 🚀 Getting Started

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

## 🛠️ Folder Configuration

Rather than being hardcoded in code, your portfolio settings and project entries are defined in the `/config` directory at the project root:

1. **Header & Contact Buttons**: Configured in [config/portfolio-header.json](file:///home/christian/git/personal_projects/config/portfolio-header.json). Controls the landing page badge, title text, description, and list of external social links (GitHub, GitLab, LinkedIn, etc.) displayed in the header and footer.
2. **Project Entries**: Located in [config/projects/](file:///home/christian/git/personal_projects/config/projects/). Each project is defined either as a single `.json` file, or as a directory containing a `project.json` and a `media/` folder (for screenshots). 

For details on the project metadata fields, see [PROJECTS_GUIDE.md](file:///home/christian/git/personal_projects/PROJECTS_GUIDE.md).

---

## ⚙️ Compilation & Automation Scripts

The project includes several utilities to compile data and pull external stats:

* **Compile Projects (`npm run compile-projects`)**: Reads the `config/projects/` folder, processes images/logos, and builds the static configuration script in the code.
* **Auto-Compiler Watcher (`npm run watch-projects`)**: Monitors the `config/projects/` folder for live edits and compiles changes automatically.
* **Update Git Stats (`npm run update-stats`)**: Fetches stars, commit counts, branches, and lines of code breakdown from GitHub and GitLab APIs. 
  *(Configure `GITHUB_TOKEN` and `GITLAB_TOKEN` to query private repositories or bypass rate limits).*
