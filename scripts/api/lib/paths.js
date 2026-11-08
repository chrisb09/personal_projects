const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../../..');

function resolveFirstExisting(candidates) {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return candidates[candidates.length - 1];
}

const configDir = resolveFirstExisting([
  process.env.PORTFOLIO_CONFIG_DIR,
  '/app/config',
  '/container/config/personal_projects/config',
  path.join(repoRoot, 'config'),
]);

const publicDir = resolveFirstExisting([
  process.env.PORTFOLIO_PUBLIC_DIR,
  '/app/public',
  '/container/data/personal_projects/public',
  path.join(repoRoot, 'public'),
]);

const repoDir = resolveFirstExisting([
  process.env.PORTFOLIO_REPO_DIR,
  '/app/repos',
  '/container/data/personal_projects/repos',
  path.join(repoRoot, 'repos'),
]);

const extraRepoDir = resolveFirstExisting([
  process.env.PORTFOLIO_EXTRA_REPO_DIR,
  '/app/extra-repos',
  path.join(repoRoot, 'extra-repos'),
]);

const contextDir = resolveFirstExisting([
  process.env.PORTFOLIO_CONTEXT_DIR,
  '/app/context',
  '/container/data/personal_projects/context',
  path.join(repoRoot, 'context'),
]);

const summariesDir = resolveFirstExisting([
  process.env.PORTFOLIO_SUMMARIES_DIR,
  '/app/data/repo-summaries',
  path.join(repoRoot, 'data/repo-summaries'),
]);

const publicBaseUrl = (process.env.PORTFOLIO_API_PUBLIC_BASE_URL || 'https://projects.christian-f-brinkmann.de').replace(/\/+$/, '');
const apiBaseUrl = `${publicBaseUrl}/api/portfolio/v1`;

module.exports = {
  repoRoot,
  configDir,
  publicDir,
  repoDir,
  extraRepoDir,
  contextDir,
  summariesDir,
  projectsDir: path.join(configDir, 'projects'),
  projectsDeFile: path.join(configDir, 'projects-de.json'),
  headerFile: path.join(configDir, 'portfolio-header.json'),
  statsFile: path.join(publicDir, 'stats.json'),
  activityFile: path.join(publicDir, 'git-activity.json'),
  projectImagesDir: path.join(publicDir, 'images/projects'),
  projectDocumentsDir: path.join(publicDir, 'documents/projects'),
  publicBaseUrl,
  apiBaseUrl,
};
