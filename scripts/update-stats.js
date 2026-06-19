const fs = require('fs');
const path = require('path');

const projectsDir = path.join(__dirname, '../projects');
const statsFilePath = path.join(__dirname, '../public/stats.json');

// Helper to parse Link header count for GitHub
function parseLinkHeaderCount(linkHeader, defaultCount) {
  if (!linkHeader) return defaultCount;
  const match = linkHeader.match(/&page=(\d+)>; rel="last"/);
  return match ? parseInt(match[1], 10) : defaultCount;
}

// Load all project JSON configs from the projects directory
function loadProjects() {
  const projects = [];
  if (!fs.existsSync(projectsDir)) return projects;

  const items = fs.readdirSync(projectsDir);
  for (const item of items) {
    const itemPath = path.join(projectsDir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      const jsonPath = path.join(itemPath, 'project.json');
      if (fs.existsSync(jsonPath)) {
        projects.push(JSON.parse(fs.readFileSync(jsonPath, 'utf8')));
      }
    } else if (item.endsWith('.json')) {
      projects.push(JSON.parse(fs.readFileSync(itemPath, 'utf8')));
    }
  }
  return projects;
}

async function updateStats() {
  const projects = loadProjects();
  console.log(`Loaded ${projects.length} projects for stats collection.`);

  // Load existing stats for caching/merging fallback
  let existingStats = { lastUpdated: new Date().toISOString(), projects: {} };
  if (fs.existsSync(statsFilePath)) {
    try {
      existingStats = JSON.parse(fs.readFileSync(statsFilePath, 'utf8'));
      console.log('Loaded existing stats.json for merging fallbacks.');
    } catch (e) {
      console.error('Failed to parse existing stats.json:', e.message);
    }
  }

  const updatedProjectsStats = {};

  for (const project of projects) {
    const projectId = project.id;
    
    // Start with fallback stats from project.json or existing stats.json
    let projectStats = existingStats.projects[projectId] || {
      stats: { stars: 0, commits: 0, branches: 0, lastCommit: '' },
      loc: { total: 0, byLanguage: {} }
    };

    // If project has static stats/loc in its definition, merge it as baseline
    if (project.stats) {
      projectStats.stats = { ...projectStats.stats, ...project.stats };
    }
    if (project.loc) {
      projectStats.loc = { ...projectStats.loc, ...project.loc };
    }

    // Attempt to fetch fresh stats if repository is configured
    const primaryRepo = project.repos && project.repos[0];
    if (primaryRepo && primaryRepo.url) {
      const repoUrl = primaryRepo.url;
      console.log(`\nFetching stats for project: ${projectId} (${repoUrl})`);

      try {
        // Detect Github
        const githubMatch = repoUrl.match(/https?:\/\/github\.com\/(.+?)\/(.+?)(?:\.git)?$/i);
        // Detect GitLab (supports custom hosts containing gitlab)
        const gitlabMatch = repoUrl.match(/https?:\/\/([^\/]*gitlab[^\/]*)\/(.+?)\/(.+?)(?:\.git)?$/i);

        if (githubMatch) {
          const [, owner, repo] = githubMatch;
          const headers = {
            'User-Agent': 'Antigravity-Portfolio-Script'
          };
          if (process.env.GITHUB_TOKEN) {
            headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
          }

          // Fetch Repository Details
          const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
          if (!repoRes.ok) throw new Error(`GitHub Repo API error: ${repoRes.status}`);
          const repoData = await repoRes.json();

          // Fetch Commits count (per_page=1 and read link header)
          let commitsCount = projectStats.stats.commits || 0;
          const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, { headers });
          if (commitsRes.ok) {
            const linkHeader = commitsRes.headers.get('link');
            const list = await commitsRes.json();
            commitsCount = parseLinkHeaderCount(linkHeader, list.length);
          }

          // Fetch Branches count
          let branchesCount = projectStats.stats.branches || 0;
          const branchesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=1`, { headers });
          if (branchesRes.ok) {
            const linkHeader = branchesRes.headers.get('link');
            const list = await branchesRes.json();
            branchesCount = parseLinkHeaderCount(linkHeader, list.length);
          }

          // Fetch Languages LOC
          const langRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers });
          let loc = projectStats.loc;
          if (langRes.ok) {
            const langBytes = await langRes.json();
            const byLanguage = {};
            let total = 0;

            // Estimate LOC: 1 LOC ≈ 55 bytes average
            Object.entries(langBytes).forEach(([lang, bytes]) => {
              const estimatedLines = Math.round(bytes / 55);
              if (estimatedLines > 0) {
                byLanguage[lang] = estimatedLines;
                total += estimatedLines;
              }
            });

            if (total > 0) {
              loc = { total, byLanguage };
            }
          }

          // Format last commit (YYYY-MM-DD)
          const lastCommitRaw = repoData.pushed_at || '';
          const lastCommit = lastCommitRaw ? lastCommitRaw.substring(0, 10) : projectStats.stats.lastCommit;

          projectStats = {
            stats: {
              stars: repoData.stargazers_count,
              commits: commitsCount,
              branches: branchesCount,
              lastCommit
            },
            loc
          };

          console.log(`Successfully fetched GitHub stats for ${projectId}`);

        } else if (gitlabMatch) {
          const [,, host, owner, repo] = gitlabMatch;
          const projectPath = `${owner}/${repo}`;
          const headers = {};
          if (process.env.GITLAB_TOKEN) {
            headers['PRIVATE-TOKEN'] = process.env.GITLAB_TOKEN;
          }

          // Fetch GitLab project details
          const projectUrl = `https://${host}/api/v4/projects/${encodeURIComponent(projectPath)}`;
          const projectRes = await fetch(projectUrl, { headers });
          if (!projectRes.ok) throw new Error(`GitLab Project API error: ${projectRes.status}`);
          const projectData = await projectRes.json();
          const gitlabId = projectData.id;

          // Fetch Commits count
          let commitsCount = projectStats.stats.commits || 0;
          const commitsRes = await fetch(`https://${host}/api/v4/projects/${gitlabId}/repository/commits?per_page=1`, { headers });
          if (commitsRes.ok) {
            const totalHeader = commitsRes.headers.get('X-Total');
            commitsCount = totalHeader ? parseInt(totalHeader, 10) : commitsCount;
          }

          // Fetch Branches count
          let branchesCount = projectStats.stats.branches || 0;
          const branchesRes = await fetch(`https://${host}/api/v4/projects/${gitlabId}/repository/branches?per_page=1`, { headers });
          if (branchesRes.ok) {
            const totalHeader = branchesRes.headers.get('X-Total');
            branchesCount = totalHeader ? parseInt(totalHeader, 10) : branchesCount;
          }

          // Fetch Languages
          const langRes = await fetch(`https://${host}/api/v4/projects/${gitlabId}/languages`, { headers });
          let loc = projectStats.loc;
          if (langRes.ok) {
            const langPercentages = await langRes.json();
            const byLanguage = {};
            
            // GitLab returns language percentages (e.g. { "TypeScript": 65.2 }).
            // We use our baseline total LOC (or fallback to 5000 if 0) and distribute it.
            const total = loc.total || 5000;
            Object.entries(langPercentages).forEach(([lang, percent]) => {
              byLanguage[lang] = Math.round((percent / 100) * total);
            });
            loc = { total, byLanguage };
          }

          // Format last commit (YYYY-MM-DD)
          const lastCommitRaw = projectData.last_activity_at || '';
          const lastCommit = lastCommitRaw ? lastCommitRaw.substring(0, 10) : projectStats.stats.lastCommit;

          projectStats = {
            stats: {
              stars: projectData.star_count || 0,
              commits: commitsCount,
              branches: branchesCount,
              lastCommit
            },
            loc
          };

          console.log(`Successfully fetched GitLab stats for ${projectId}`);
        } else {
          console.log(`Repository type not supported for API stats: ${repoUrl}`);
        }
      } catch (err) {
        console.error(`Failed to fetch live stats for ${projectId}:`, err.message);
        console.log(`Keeping existing fallback stats for ${projectId}`);
      }
    }

    updatedProjectsStats[projectId] = projectStats;
  }

  // Save to public/stats.json
  const finalStats = {
    lastUpdated: new Date().toISOString(),
    projects: updatedProjectsStats
  };

  fs.writeFileSync(statsFilePath, JSON.stringify(finalStats, null, 2), 'utf8');
  console.log(`\nSuccessfully updated stats file: ${statsFilePath}`);
}

updateStats().catch(console.error);
