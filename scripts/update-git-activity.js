const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const projectDir = path.join(__dirname, '../config/projects');
const statsConfig = require('../config/stats-config.json');
const reposDir = process.env.PORTFOLIO_REPOS_DIR || path.join(__dirname, '../repos');
const extraReposDir = process.env.PORTFOLIO_EXTRA_REPOS_DIR || path.join(__dirname, '../extra-repos');
const output = path.join(__dirname, '../public/git-activity.json');
const timeZone = 'Europe/Berlin';
const githubUsername = process.env.GITHUB_USERNAME || 'chrisb09';
const authorPatterns = statsConfig.authors.map(pattern => new RegExp(pattern, 'i'));
const dayMs = 24 * 60 * 60 * 1000;
const windowDays = 365;

function localDate(isoDate) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(isoDate));
  const get = type => parts.find(part => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function activityLevel(count) {
  if (count === 0) return 0;
  if (count < 3) return 1;
  if (count < 6) return 2;
  if (count < 11) return 3;
  return 4;
}

function validateGitHubDays(days, source) {
  if (days.size < 350) throw new Error(`Expected roughly a year of ${source} days, received ${days.size}`);
  const total = [...days.values()].reduce((sum, count) => sum + count, 0);
  if (total < 1) throw new Error(`${source} returned no contributions`);
  return days;
}

// Prefer the GraphQL API when a token is configured; the deployment currently runs without one.
async function fetchGitHubGraphQL() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `bearer ${token}`,
        'User-Agent': 'personal-projects-portfolio/1.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}',
        variables: { login: githubUsername },
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      console.warn(`GitHub GraphQL returned ${response.status}; using the public contributions calendar instead.`);
      return null;
    }
    const data = await response.json();
    const weeks = data?.data?.user?.contributionsCollection?.contributionCalendar?.weeks || [];
    const days = new Map();
    for (const week of weeks) {
      for (const day of week.contributionDays || []) days.set(day.date, day.contributionCount);
    }
    return { days: validateGitHubDays(days, 'GraphQL'), source: 'graphql' };
  } catch (error) {
    console.warn(`GitHub GraphQL failed (${error.message}); using the public contributions calendar instead.`);
    return null;
  }
}

async function fetchGitHubCalendar() {
  const response = await fetch(`https://github.com/users/${githubUsername}/contributions`, {
    headers: { 'User-Agent': 'personal-projects-portfolio/1.0', Accept: 'text/html' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`GitHub contributions returned ${response.status}`);

  const html = await response.text();
  const days = new Map();
  for (const [, date, , tooltip] of html.matchAll(/<td\b[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="([0-4])"[^>]*><\/td>\s*<tool-tip\b[^>]*>([^<]*)<\/tool-tip>/g)) {
    const match = tooltip.match(/^(\d[\d,]*) contributions? on /);
    const count = tooltip.startsWith('No contributions on ') ? 0 : match ? Number(match[1].replaceAll(',', '')) : NaN;
    if (!Number.isFinite(count)) throw new Error(`Unexpected contribution tooltip: ${tooltip}`);
    days.set(date, count);
  }
  return { days: validateGitHubDays(days, 'the public calendar'), source: 'public-calendar' };
}

// Recursively find all git repositories (including submodules and nested repos)
function findGitRepositories(dir, seenRealPaths = new Set(), depth = 0, maxDepth = 4) {
  const repos = [];
  if (depth > maxDepth || !fs.existsSync(dir)) return repos;

  let real;
  try {
    real = fs.realpathSync(dir);
  } catch (e) {
    return repos;
  }
  if (seenRealPaths.has(real)) return repos;
  seenRealPaths.add(real);

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const hasGit = entries.some(e => e.name === '.git');
    if (hasGit) {
      repos.push(dir);
    }
    for (const e of entries) {
      if (e.name === '.git' || e.name === 'node_modules' || e.name === '.venv') continue;
      if (e.isDirectory() || e.isSymbolicLink()) {
        const sub = path.join(dir, e.name);
        repos.push(...findGitRepositories(sub, seenRealPaths, depth + 1, maxDepth));
      }
    }
  } catch (err) {}
  return repos;
}

function getRepoRemoteInfo(repoPath) {
  let url = '';
  let host = 'local';
  try {
    url = execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd: repoPath,
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
    if (url) {
      const match = url.match(/^(?:https?:\/\/|git@)([^:\/]+)[:\/](.+)$/i);
      if (match) {
        host = match[1].toLowerCase();
      }
    }
  } catch (err) {
    // No remote found -> host is 'local'
  }
  const name = path.basename(repoPath);
  return { path: repoPath, name, url, host };
}

function listTrackedRepositories() {
  const repos = [];
  const seen = new Set();
  for (const folder of fs.readdirSync(projectDir, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;
    const configPath = path.join(projectDir, folder.name, 'project.json');
    if (!fs.existsSync(configPath)) continue;
    const project = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    for (const repo of project.repos || []) {
      if (!repo.url || seen.has(repo.url)) continue;
      seen.add(repo.url);
      const url = new URL(repo.url);
      const name = path.basename(url.pathname).replace(/\.git$/, '');
      const repoPath = path.join(reposDir, name);
      repos.push({
        host: url.hostname.toLowerCase(),
        name,
        url: repo.url,
        path: repoPath,
      });
    }
  }
  return repos;
}

function listUnlistedRepositories(trackedRepoRealPaths) {
  const unlisted = [];
  if (!fs.existsSync(extraReposDir)) return unlisted;

  const discoveredPaths = findGitRepositories(extraReposDir);
  for (const p of discoveredPaths) {
    let real = p;
    try {
      real = fs.realpathSync(p);
    } catch {}
    if (trackedRepoRealPaths.has(real)) continue; // Already covered by tracked projects

    const info = getRepoRemoteInfo(p);
    unlisted.push(info);
  }
  return unlisted;
}

// Commits in GitHub repositories are already part of the GitHub contributions calendar.
// Collect commit hashes from all local GitHub clones (tracked + unlisted) to prevent double counting.
function collectGitHubCloneHashes(allRepos) {
  const hashes = new Set();
  for (const repo of allRepos) {
    if (repo.host !== 'github.com') continue;
    if (!fs.existsSync(path.join(repo.path, '.git'))) continue;
    try {
      const output = execFileSync('git', ['rev-list', 'HEAD'], {
        cwd: repo.path,
        maxBuffer: 64 * 1024 * 1024,
        timeout: 30000,
        stdio: ['ignore', 'pipe', 'ignore'],
      }).toString();
      for (const hash of output.split('\n')) if (hash) hashes.add(hash);
    } catch {
      // Ignored
    }
  }
  return hashes;
}

function collectNonGitHubCommits(nonGitHubRepos, githubCommitHashes) {
  const counts = new Map();
  const hosts = new Set();
  const missingRepositories = [];
  const seenCommits = new Set();
  let repositories = 0;

  for (const repo of nonGitHubRepos) {
    if (!fs.existsSync(path.join(repo.path, '.git'))) {
      if (repo.url) missingRepositories.push(repo.url);
      continue;
    }

    let log;
    try {
      log = execFileSync('git', ['log', 'HEAD', '--format=%H%x09%aI%x09%an%x09%ae'], {
        cwd: repo.path,
        maxBuffer: 64 * 1024 * 1024,
        timeout: 30000,
        stdio: ['ignore', 'pipe', 'ignore'],
      }).toString();
    } catch (error) {
      console.warn(`Skipping ${repo.name} (${repo.url || repo.path}): ${error.message}`);
      if (repo.url) missingRepositories.push(repo.url);
      continue;
    }

    repositories++;
    hosts.add(repo.host);
    for (const row of log.split('\n')) {
      if (!row) continue;
      const [hash, timestamp, name, email] = row.split('\t');
      if (!hash || !timestamp || !name || !email || seenCommits.has(hash) || githubCommitHashes.has(hash)) continue;
      if (!authorPatterns.some(pattern => pattern.test(name) || pattern.test(email) || pattern.test(`${name} <${email}>`))) continue;

      const date = localDate(timestamp);
      const day = counts.get(date) || { count: 0, hosts: {} };
      seenCommits.add(hash); // A commit mirrored across multiple repos counts only once
      day.count++;
      day.hosts[repo.host] = (day.hosts[repo.host] || 0) + 1;
      counts.set(date, day);
    }
  }

  return { counts, hosts: [...hosts].sort(), missingRepositories, repositories };
}

async function updateActivity() {
  const trackedRepos = listTrackedRepositories();

  // Resolve realpaths of tracked repos so unlisted repos don't duplicate them
  const trackedRealPaths = new Set();
  for (const r of trackedRepos) {
    try {
      if (fs.existsSync(r.path)) trackedRealPaths.add(fs.realpathSync(r.path));
    } catch {}
  }

  const unlistedRepos = listUnlistedRepositories(trackedRealPaths);
  const allRepos = [...trackedRepos, ...unlistedRepos];

  console.log(`[Activity] Scanning ${trackedRepos.length} tracked and ${unlistedRepos.length} unlisted repository trees...`);

  const github = (await fetchGitHubGraphQL()) || await fetchGitHubCalendar();
  const githubCommitHashes = collectGitHubCloneHashes(allRepos);
  const nonGitHubRepos = allRepos.filter(r => r.host !== 'github.com');
  const nonGitHubActivity = collectNonGitHubCommits(nonGitHubRepos, githubCommitHashes);

  const today = localDate(new Date());
  const end = Date.parse(`${today}T00:00:00Z`);
  const days = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const date = new Date(end - i * dayMs).toISOString().slice(0, 10);
    const githubCount = github.days.get(date) || 0;
    const extraDay = nonGitHubActivity.counts.get(date);
    const hosts = {};
    if (githubCount > 0) hosts['github.com'] = githubCount;
    for (const [host, count] of Object.entries(extraDay?.hosts || {})) {
      hosts[host] = (hosts[host] || 0) + count;
    }
    const count = githubCount + (extraDay?.count || 0);
    days.push({ date, count, level: activityLevel(count), hosts });
  }

  if (!days.some(day => day.count > 0)) throw new Error('No activity within the reporting window');

  const allHosts = new Set(['github.com', ...nonGitHubActivity.hosts]);

  const result = {
    updatedAt: new Date().toISOString(),
    timeZone,
    scope: 'GitHub contributions enriched with authored commits from GitLab and unlisted repositories',
    github: { user: githubUsername, source: github.source },
    hosts: [...allHosts],
    trackedRepositories: trackedRepos.length,
    unlistedRepositories: unlistedRepos.length,
    nonGitHubRepositories: nonGitHubActivity.repositories,
    missingRepositories: nonGitHubActivity.missingRepositories,
    days,
  };
  const temporary = `${output}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(result, null, 2)}\n`);
  fs.renameSync(temporary, output);
  console.log(`[Activity] Updated activity from GitHub (${github.source}) and ${nonGitHubActivity.repositories} non-GitHub repos (${unlistedRepos.length} unlisted scanned)`);
}

updateActivity().catch(error => {
  console.error('[Activity] Activity update failed; keeping the previous snapshot:', error);
  process.exitCode = 1;
});
