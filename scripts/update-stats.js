const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

const projectsDir = path.join(__dirname, '../config/projects');
const statsFilePath = path.join(__dirname, '../public/stats.json');
const statsConfigPath = path.join(__dirname, '../config/stats-config.json');
const reposDir = path.join(__dirname, '../repos');
const authorsReportPath = path.join(__dirname, '../authors-report.txt');

// Ensure directory for cloned repositories exists
if (!fs.existsSync(reposDir)) {
  fs.mkdirSync(reposDir, { recursive: true });
}

// Helper to execute Git commands synchronously with terminal prompts disabled
function runGit(command, cwd) {
  return execSync(command, {
    cwd,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    maxBuffer: 100 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'] // suppress stderr to avoid pollution, capture stdout
  });
}

// Load stats config containing author patterns and ignore rules
function loadStatsConfig() {
  if (fs.existsSync(statsConfigPath)) {
    try {
      return JSON.parse(fs.readFileSync(statsConfigPath, 'utf8'));
    } catch (e) {
      console.error('Failed to parse stats-config.json:', e.message);
    }
  }
  // Default fallback config
  return {
    authors: [
      "Christian.*Brinkmann",
      "christian\\.brinkmann.*",
      "chrisb09",
      "christianbrinkmann"
    ],
    ignoreExtensions: [
      ".log", ".lock", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".pdf", 
      ".zip", ".gz", ".tar", ".woff", ".woff2", ".ttf", ".eot", ".svg"
    ],
    ignoreFiles: [
      "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "go.sum"
    ],
    ignoreDirectories: [
      "node_modules", ".git", "dist", ".next", "build", "public", "repos", "temp", "tmp"
    ]
  };
}

// Convert Git HTTPS URL to SSH format for passwordless auth using local SSH keys
function getSshGitUrl(url) {
  if (url.startsWith('git@') || url.startsWith('ssh://')) {
    return url; // Already SSH
  }
  
  try {
    const match = url.match(/^https?:\/\/([^\/]+)\/(.+)$/i);
    if (match) {
      const host = match[1];
      let repoPath = match[2];
      if (!repoPath.endsWith('.git')) {
        repoPath += '.git';
      }
      return `git@${host}:${repoPath}`;
    }
  } catch (e) {
    // ignore parsing errors and use original URL
  }
  return url;
}

// Extract directory name from repo URL
function getRepoDirName(url) {
  const cleanUrl = url.replace(/\.git$/, '');
  const parts = cleanUrl.split('/');
  return parts[parts.length - 1] || 'temp-repo';
}

// Map extensions to language names
const extensionToLanguage = {
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.py': 'Python',
  '.go': 'Go',
  '.java': 'Java',
  '.c': 'C',
  '.cpp': 'C++',
  '.h': 'C/C++ Header',
  '.hpp': 'C/C++ Header',
  '.cs': 'C#',
  '.sh': 'Shell',
  '.bash': 'Shell',
  '.yml': 'YAML',
  '.yaml': 'YAML',
  '.json': 'JSON',
  '.md': 'Markdown',
  '.css': 'CSS',
  '.html': 'HTML',
  '.scss': 'SCSS',
  '.rs': 'Rust',
  '.php': 'PHP',
  '.rb': 'Ruby',
  '.pl': 'Perl',
  '.pm': 'Perl',
  '.kt': 'Kotlin',
  '.swift': 'Swift',
  '.scala': 'Scala',
  '.m': 'Objective-C',
  '.sql': 'SQL',
  '.scad': 'OpenSCAD',
  '.vue': 'Vue',
  '.svelte': 'Svelte',
  '.r': 'R',
  '.dart': 'Dart'
};

function getLanguageForFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (extensionToLanguage[ext]) {
    return extensionToLanguage[ext];
  }
  if (ext) {
    return ext.substring(1).toUpperCase();
  }
  return 'Other';
}

// Check if a file should be ignored based on stats-config rules
function shouldIgnore(filePath, config) {
  const basename = path.basename(filePath);
  if (config.ignoreFiles.includes(basename)) {
    return true;
  }
  
  const ext = path.extname(filePath).toLowerCase();
  if (config.ignoreExtensions.includes(ext)) {
    return true;
  }
  
  const segments = filePath.split(/[\\/]/);
  for (const segment of segments) {
    if (config.ignoreDirectories.includes(segment)) {
      return true;
    }
  }
  
  return false;
}

// Check if file is binary by searching for null bytes
function isBinaryFile(filePath) {
  const buffer = Buffer.alloc(512);
  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
    fs.closeSync(fd);
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) {
        return true;
      }
    }
    return false;
  } catch (err) {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch (e) {}
    }
    return true; // assume binary on read failure
  }
}

// Load all project JSON configs from config/projects/*
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
    }
  }
  return projects;
}

// Run git blame asynchronously for a single file
async function analyzeFileBlame(file, repoPath, config, matchesAuthor, excludeFirstCommit = false, firstCommitHashes = new Set()) {
  const fullFilePath = path.join(repoPath, file);
  if (shouldIgnore(file, config) || isBinaryFile(fullFilePath)) {
    return null;
  }

  const lang = getLanguageForFile(file);
  let localLocTotal = 0;
  const localLocByLanguage = {};
  const localAuthorsList = [];

  try {
    const blameOutput = await new Promise((resolve, reject) => {
      exec(`git blame --line-porcelain -- "${file}"`, {
        cwd: repoPath,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
        maxBuffer: 100 * 1024 * 1024
      }, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });

    let currentSha = null;
    const commitCache = new Map();
    let tempAuthor = null;
    let tempEmail = null;

    const lines = blameOutput.split('\n');
    for (const line of lines) {
      if (line.startsWith('\t')) {
        let authorDetails = commitCache.get(currentSha) || { name: tempAuthor, email: tempEmail };
        if (authorDetails) {
          if (excludeFirstCommit && firstCommitHashes.has(currentSha)) {
            authorDetails = { name: "Original Codebase", email: "imported@repo" };
          }
          const authorStr = `${authorDetails.name} <${authorDetails.email}>`;
          localAuthorsList.push(authorStr);

          const name = authorDetails.name;
          const email = authorDetails.email;
          if (matchesAuthor(name, email)) {
            localLocTotal++;
            localLocByLanguage[lang] = (localLocByLanguage[lang] || 0) + 1;
          }
        }
      } else {
        const firstSpace = line.indexOf(' ');
        const header = firstSpace === -1 ? line : line.substring(0, firstSpace);
        const value = firstSpace === -1 ? '' : line.substring(firstSpace + 1);

        if (header.length === 40 || header.length === 64) {
          currentSha = header;
          tempAuthor = null;
          tempEmail = null;
        } else if (header === 'author') {
          tempAuthor = value;
        } else if (header === 'author-mail') {
          tempEmail = value.replace(/^<|>/g, '');
        } else if (header === 'filename') {
          if (currentSha && tempAuthor) {
            commitCache.set(currentSha, { name: tempAuthor, email: tempEmail });
          }
        }
      }
    }

    return { localLocTotal, localLocByLanguage, localAuthorsList };
  } catch (blameErr) {
    console.warn(`Failed to run git blame on file ${file}: ${blameErr.message}`);
    return null;
  }
}

// Process files concurrently in parallel batches
async function processFilesParallel(files, repoPath, config, matchesAuthor, excludeFirstCommit = false, firstCommitHashes = new Set(), concurrencyLimit = 15) {
  let index = 0;
  let projectLocTotal = 0;
  const projectLocByLanguage = {};
  const localAuthorsListAll = [];

  const workers = Array(concurrencyLimit).fill(null).map(async () => {
    while (index < files.length) {
      const file = files[index++];
      const result = await analyzeFileBlame(file, repoPath, config, matchesAuthor, excludeFirstCommit, firstCommitHashes);
      if (result) {
        projectLocTotal += result.localLocTotal;
        for (const [lang, count] of Object.entries(result.localLocByLanguage)) {
          projectLocByLanguage[lang] = (projectLocByLanguage[lang] || 0) + count;
        }
        localAuthorsListAll.push(...result.localAuthorsList);
      }
    }
  });

  await Promise.all(workers);
  return { projectLocTotal, projectLocByLanguage, localAuthorsListAll };
}

async function updateStats() {
  const config = loadStatsConfig();
  const authorRegexes = config.authors.map(pattern => new RegExp(pattern, 'i'));

  function matchesAuthor(name, email) {
    const checkStr = `${name} <${email}>`;
    return authorRegexes.some(regex => regex.test(name) || regex.test(email) || regex.test(checkStr));
  }

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

  const forceReanalyze = process.argv.includes('--force') || process.argv.includes('-f');
  if (forceReanalyze) {
    console.log('Force re-analyze flag detected. Bypassing cache for all repositories...');
    existingStats.projects = {};
  }

  const updatedProjectsStats = {};
  const globalAuthorsMap = new Map();

  for (const project of projects) {
    const projectId = project.id;
    
    // Start with fallback stats from project.json or existing stats.json
    let projectStats = existingStats.projects[projectId] || {
      stats: { stars: 0, commits: 0, branches: 0, lastCommit: '' },
      loc: { total: 0, byLanguage: {} }
    };

    if (project.stats) {
      projectStats.stats = { ...projectStats.stats, ...project.stats };
    }
    if (project.loc) {
      projectStats.loc = { ...projectStats.loc, ...project.loc };
    }

    // Step A: Fetch stars from hosting API if possible (we need API for stars)
    const primaryRepo = project.repos && project.repos[0];
    let fetchedStars = null;

    if (primaryRepo && primaryRepo.url && !project.excludeFromStats) {
      const repoUrl = primaryRepo.url;
      try {
        const githubMatch = repoUrl.match(/https?:\/\/github\.com\/(.+?)\/(.+?)(?:\.git)?$/i);
        const gitlabMatch = repoUrl.match(/https?:\/\/([^\/]*gitlab[^\/]*)\/(.+?)\/(.+?)(?:\.git)?$/i);

        if (githubMatch) {
          const [, owner, repo] = githubMatch;
          const headers = { 'User-Agent': 'Antigravity-Portfolio-Script' };
          if (process.env.GITHUB_TOKEN) {
            headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
          }
          const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
          if (repoRes.ok) {
            const repoData = await repoRes.json();
            fetchedStars = repoData.stargazers_count;
            console.log(`Fetched stars for ${projectId} from GitHub: ${fetchedStars}`);
          }
        } else if (gitlabMatch) {
          const [, host, owner, repo] = gitlabMatch;
          const projectPath = `${owner}/${repo}`;
          const headers = {};
          const envTokenName = `GITLAB_TOKEN_${host.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
          const gitlabToken = process.env[envTokenName] || process.env.GITLAB_TOKEN;
          if (gitlabToken) {
            headers['PRIVATE-TOKEN'] = gitlabToken;
          }
          const projectUrl = `https://${host}/api/v4/projects/${encodeURIComponent(projectPath)}`;
          const projectRes = await fetch(projectUrl, { headers });
          if (projectRes.ok) {
            const projectData = await projectRes.json();
            fetchedStars = projectData.star_count || 0;
            console.log(`Fetched stars for ${projectId} from GitLab: ${fetchedStars}`);
          }
        }
      } catch (err) {
        console.warn(`Failed to fetch stars for ${projectId}: ${err.message}`);
      }
    }

    if (fetchedStars !== null) {
      projectStats.stats.stars = fetchedStars;
    }

    // Step B: Clone/Update repositories locally and analyze line-by-line attribution
    if (project.repos && project.repos.length > 0) {
      let projectLocTotal = 0;
      const projectLocByLanguage = {};
      let totalCommits = 0;
      let totalBranches = 0;
      let latestCommitDate = '';
      let analyzedSuccessfully = false;

      // Cache dictionaries
      const repoHashes = {};
      const repoAuthors = {};
      const repoLocs = {};
      const repoCommits = {};
      const repoBranches = {};
      const repoLastCommit = {};

      for (const repo of project.repos) {
        if (!repo.url) continue;

        const repoDirName = getRepoDirName(repo.url);
        const repoPath = path.join(reposDir, repoDirName);
        const sshUrl = getSshGitUrl(repo.url);

        try {
          const hasGitFolder = fs.existsSync(repoPath) && fs.existsSync(path.join(repoPath, '.git'));
          if (!hasGitFolder) {
            if (fs.existsSync(repoPath)) {
              fs.rmSync(repoPath, { recursive: true, force: true });
            }
            console.log(`Cloning ${repo.url} via SSH into ${repoPath}...`);
            runGit(`git clone "${sshUrl}" "${repoPath}"`);
          } else {
            console.log(`Updating remote URL and fetching for ${repo.url} in ${repoPath}...`);
            try {
              runGit(`git remote set-url origin "${sshUrl}"`, repoPath);
            } catch (remoteErr) {
              console.warn(`Failed to set remote URL to SSH for ${repo.url}: ${remoteErr.message}`);
            }
            runGit(`git fetch --all`, repoPath);
            try {
              runGit(`git remote set-head origin -a`, repoPath);
              runGit(`git reset --hard origin/HEAD`, repoPath);
            } catch (e) {
              runGit(`git reset --hard HEAD`, repoPath);
              runGit(`git pull`, repoPath);
            }
          }

          // Check current commit hash
          const currentCommitHash = runGit('git rev-parse HEAD', repoPath).toString().trim();
          
          const excludeFirstCommit = !!repo.excludeFirstCommit;
          const firstCommitHashes = new Set();
          if (excludeFirstCommit) {
            try {
              const hashes = runGit('git rev-list --max-parents=0 HEAD', repoPath).toString().trim().split('\n');
              for (const h of hashes) {
                if (h.trim()) firstCommitHashes.add(h.trim());
              }
            } catch (e) {
              console.warn(`Failed to retrieve first commit for ${repo.url}: ${e.message}`);
            }
          }

          // Check if we can reuse cached stats for this repository
          const cachedHash = existingStats.projects[projectId]?.repoHashes?.[repoDirName];
          const cachedLoc = existingStats.projects[projectId]?.repoLocs?.[repoDirName];
          const cachedAuthors = existingStats.projects[projectId]?.repoAuthors?.[repoDirName];
          const cachedCommits = existingStats.projects[projectId]?.repoCommits?.[repoDirName];
          const cachedBranches = existingStats.projects[projectId]?.repoBranches?.[repoDirName];
          const cachedLastCommit = existingStats.projects[projectId]?.repoLastCommit?.[repoDirName];
          const cachedExcludeFirstCommit = !!cachedLoc?.excludeFirstCommit;

          if (cachedHash && cachedHash === currentCommitHash && cachedLoc && cachedAuthors && cachedExcludeFirstCommit === excludeFirstCommit) {
            console.log(`Using cached stats for repo: ${repoDirName} at commit ${currentCommitHash}`);
            
            projectLocTotal += cachedLoc.total || 0;
            if (cachedLoc.byLanguage) {
              for (const [lang, count] of Object.entries(cachedLoc.byLanguage)) {
                projectLocByLanguage[lang] = (projectLocByLanguage[lang] || 0) + count;
              }
            }
            totalCommits += cachedCommits || 0;
            totalBranches += cachedBranches || 0;
            if (cachedLastCommit && (!latestCommitDate || cachedLastCommit > latestCommitDate)) {
              latestCommitDate = cachedLastCommit;
            }

            // Reconstruct global authors map
            for (const [authorStr, count] of Object.entries(cachedAuthors)) {
              globalAuthorsMap.set(authorStr, (globalAuthorsMap.get(authorStr) || 0) + count);
            }

            // Carry over cache records
            repoHashes[repoDirName] = cachedHash;
            repoLocs[repoDirName] = cachedLoc;
            repoAuthors[repoDirName] = cachedAuthors;
            repoCommits[repoDirName] = cachedCommits || 0;
            repoBranches[repoDirName] = cachedBranches || 0;
            repoLastCommit[repoDirName] = cachedLastCommit || '';

            analyzedSuccessfully = true;
            continue;
          }

          console.log(`Analyzing local repo: ${repoDirName}...`);

          // 1. Get branch count
          const branchesOutput = runGit('git branch -r', repoPath).toString();
          const repoBranchesCount = branchesOutput.trim().split('\n')
            .filter(line => line.trim() && !line.includes('origin/HEAD'))
            .length;
          totalBranches += repoBranchesCount;

          // 2. Get commit count and collect files modified by matching author(s)
          const gitLogOutput = runGit('git log --format="COMMIT:%an <%ae>:%H" --name-only', repoPath).toString();
          const logLines = gitLogOutput.split('\n');

          let currentCommitIsMine = false;
          let matchedCommits = 0;
          const modifiedFilesByMe = new Set();

          for (const line of logLines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('COMMIT:')) {
              const headerPart = trimmed.substring(7); // remove 'COMMIT:'
              const colonIndex = headerPart.lastIndexOf(':');
              if (colonIndex !== -1) {
                const authorDetails = headerPart.substring(0, colonIndex);
                const commitHash = headerPart.substring(colonIndex + 1);

                const emailStart = authorDetails.lastIndexOf('<');
                const emailEnd = authorDetails.lastIndexOf('>');

                let name = authorDetails;
                let email = '';
                if (emailStart !== -1 && emailEnd !== -1 && emailEnd > emailStart) {
                  name = authorDetails.substring(0, emailStart).trim();
                  email = authorDetails.substring(emailStart + 1, emailEnd);
                }

                if (excludeFirstCommit && firstCommitHashes.has(commitHash)) {
                  currentCommitIsMine = false;
                } else if (matchesAuthor(name, email)) {
                  matchedCommits++;
                  currentCommitIsMine = true;
                } else {
                  currentCommitIsMine = false;
                }
              }
            } else {
              if (currentCommitIsMine) {
                modifiedFilesByMe.add(trimmed);
              }
            }
          }
          totalCommits += matchedCommits;

          // 3. Get last commit date (YYYY-MM-DD)
          const lastCommitOutput = runGit('git log -1 --format=%cs', repoPath).toString().trim();
          if (lastCommitOutput && (!latestCommitDate || lastCommitOutput > latestCommitDate)) {
            latestCommitDate = lastCommitOutput;
          }

          // 4. Analyze tracked files in parallel batches (filtering only those modified by me)
          const filesOutput = runGit('git ls-files', repoPath).toString().trim();
          const allFiles = filesOutput.split('\n').filter(f => f.trim() !== '');
          const files = allFiles.filter(f => modifiedFilesByMe.has(f));

          const analysis = await processFilesParallel(files, repoPath, config, matchesAuthor, excludeFirstCommit, firstCommitHashes, 15);
          
          projectLocTotal += analysis.projectLocTotal;
          for (const [lang, count] of Object.entries(analysis.projectLocByLanguage)) {
            projectLocByLanguage[lang] = (projectLocByLanguage[lang] || 0) + count;
          }

          // Cache specific repo authors
          const localAuthorsCount = {};
          for (const authorStr of analysis.localAuthorsListAll) {
            globalAuthorsMap.set(authorStr, (globalAuthorsMap.get(authorStr) || 0) + 1);
            localAuthorsCount[authorStr] = (localAuthorsCount[authorStr] || 0) + 1;
          }

          // Save current repo run to cache dictionaries
          repoHashes[repoDirName] = currentCommitHash;
          repoLocs[repoDirName] = { 
            total: analysis.projectLocTotal, 
            byLanguage: analysis.projectLocByLanguage,
            excludeFirstCommit: excludeFirstCommit
          };
          repoAuthors[repoDirName] = localAuthorsCount;
          repoCommits[repoDirName] = matchedCommits;
          repoBranches[repoDirName] = repoBranchesCount;
          repoLastCommit[repoDirName] = lastCommitOutput;

          analyzedSuccessfully = true;
        } catch (repoErr) {
          console.error(`Failed to analyze repo ${repo.url} for project ${projectId}:`, repoErr.message);
        }
      }

      if (analyzedSuccessfully) {
        projectStats.loc = {
          total: projectLocTotal,
          byLanguage: projectLocByLanguage
        };
        projectStats.stats.commits = totalCommits;
        projectStats.stats.branches = totalBranches;
        if (latestCommitDate) {
          projectStats.stats.lastCommit = latestCommitDate;
        }

        // Save cache metadata to stats file
        projectStats.repoHashes = repoHashes;
        projectStats.repoLocs = repoLocs;
        projectStats.repoAuthors = repoAuthors;
        projectStats.repoCommits = repoCommits;
        projectStats.repoBranches = repoBranches;
        projectStats.repoLastCommit = repoLastCommit;

        console.log(`Project ${projectId} stats updated: LOC total=${projectLocTotal}, commits=${totalCommits}, lastCommit=${latestCommitDate}`);
      } else {
        console.log(`Keeping fallback stats for project ${projectId} since local analysis failed/skipped.`);
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

  // Save global authors report split into Matched vs Unmatched
  const sortedAuthors = [...globalAuthorsMap.entries()]
    .sort((a, b) => b[1] - a[1]);

  const matchedGroup = [];
  const unmatchedGroup = [];

  for (const [author, count] of sortedAuthors) {
    const match = author.match(/^(.*?) <(.*?)>$/);
    let matched = false;
    if (match) {
      matched = matchesAuthor(match[1], match[2]);
    } else {
      matched = matchesAuthor(author, '');
    }

    const reportLine = `${author}: ${count} lines`;
    if (matched) {
      matchedGroup.push(reportLine);
    } else {
      unmatchedGroup.push(reportLine);
    }
  }

  const reportContent = [
    `=== MATCHED AUTHORS (ME) ===`,
    matchedGroup.length > 0 ? matchedGroup.join('\n') : `(No matched authors found)`,
    `\n=== UNMATCHED AUTHORS (OTHERS) ===`,
    unmatchedGroup.length > 0 ? unmatchedGroup.join('\n') : `(No unmatched authors found)`
  ].join('\n');

  fs.writeFileSync(authorsReportPath, reportContent, 'utf8');
  console.log(`Successfully generated split authors report: ${authorsReportPath}`);
}

updateStats().catch(console.error);
