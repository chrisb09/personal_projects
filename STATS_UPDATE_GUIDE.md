# Stats Update Guide

This guide explains how to set up your external script to update project statistics without requiring website recompilation.

## Architecture

The website uses a simple file-based stats system:

1. **Static File**: `public/stats.json` - Contains all project statistics
2. **Runtime Fetching**: The website fetches this file on page load with cache-busting
3. **External Script**: Your script updates `public/stats.json` periodically
4. **No Recompile**: Changes are picked up automatically within 60 seconds

## Getting Project Metadata

Your external script can read the static project configuration to know which projects need stats:

```javascript
// Read src/config/projects.ts to get:
// - Project IDs
// - Repository URLs
// - Documentation URLs
// - Demo URLs

// Example: Extract project info
const projects = require('./src/config/projects.ts').projects;
const projectsToUpdate = projects
  .filter(p => p.repoUrl)
  .map(p => ({
    id: p.id,
    name: p.name,
    repoUrl: p.repoUrl
  }));
```

## Updating stats.json

Your external script should update `public/stats.json` with this structure:

```json
{
  "lastUpdated": "2024-01-15T10:30:00Z",
  "projects": {
    "project-id-1": {
      "stats": {
        "stars": 42,
        "commits": 256,
        "branches": 3,
        "lastCommit": "2024-01-15T09:45:00Z"
      },
      "loc": {
        "total": 15234,
        "byLanguage": {
          "TypeScript": 8234,
          "CSS": 3500,
          "JavaScript": 3500
        }
      }
    },
    "project-id-2": {
      "stats": { ... },
      "loc": { ... }
    }
  }
}
```

## Example: Update Script (Node.js)

```javascript
import fs from 'fs';
import path from 'path';

async function updateStats() {
  // Load project IDs and repo URLs
  const projects = JSON.parse(fs.readFileSync('./src/config/projects.json', 'utf-8'));
  
  const stats = {
    lastUpdated: new Date().toISOString(),
    projects: {}
  };

  // For each project, collect stats
  for (const project of projects) {
    if (!project.repoUrl) continue;

    try {
      // Example: Fetch GitHub stats
      const repoMatch = project.repoUrl.match(/github\.com\/(.+?)\/(.+?)(?:\.git)?$/);
      if (repoMatch) {
        const [, owner, repo] = repoMatch;
        
        // Use GitHub API (requires GITHUB_TOKEN env var)
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}`,
          {
            headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` }
          }
        );
        
        const data = await response.json();
        
        stats.projects[project.id] = {
          stats: {
            stars: data.stargazers_count,
            commits: data.commits_count || 0, // May need separate API call
            branches: data.forks_count,
            lastCommit: data.pushed_at
          },
          loc: {
            total: 0,
            byLanguage: {} // Use cloc or similar to get LOC
          }
        };
      }
    } catch (error) {
      console.error(`Failed to fetch stats for ${project.id}:`, error.message);
    }
  }

  // Write to public/stats.json
  const statsPath = path.join(process.cwd(), 'public/stats.json');
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  console.log(`Stats updated: ${statsPath}`);
}

// Run the update
updateStats().catch(console.error);
```

## How the Website Picks Up Changes

1. User visits the website
2. `src/App.tsx` calls `fetchStats()` from `src/lib/stats.ts`
3. The function fetches `/stats.json?t=${timestamp}` (cache-busting)
4. Stats are merged with project data
5. UI updates to show the latest stats

## Cache Behavior

- First load: Fetches and caches stats in memory
- Within 60 seconds: Uses cached stats
- After 60 seconds: Checks for updates
- Query parameter `t=${timestamp}` prevents browser cache

## Deployment

When deploying:
1. The `public/stats.json` file is served as a static asset
2. No server-side processing needed
3. Just upload your built files to hosting

## Security Notes

- The website only **reads** from `public/stats.json`
- No write endpoints are exposed
- External scripts update the file directly on the server
- Stats are public data (no sensitive information)

## Troubleshooting

**Stats not updating:**
- Check that `public/stats.json` has valid JSON
- Clear browser cache (or wait 60 seconds)
- Check browser console for fetch errors
- Verify file is readable by the web server

**Old stats still showing:**
- The browser caches stats for 60 seconds
- Try adding `?cache-bust=true` to see changes immediately
- Hard refresh browser (Ctrl+Shift+R)

## Integration with CI/CD

You can run the update script as a scheduled job:

```yaml
# .github/workflows/update-stats.yml
name: Update Project Stats
on:
  schedule:
    - cron: '0 * * * *'  # Every hour

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: node scripts/update-stats.js
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: 'chore: update project statistics'
```
