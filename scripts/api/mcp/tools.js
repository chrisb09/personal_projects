const { z } = require('zod');
const {
  listProjects,
  getProject,
  getProfileData,
  getStatsData,
  getStatsForProject,
  getActivityData,
} = require('../lib/projects');
const {
  listDocuments,
  readDocumentText,
  searchDocuments,
} = require('../lib/documents');
const {
  listRepos,
  listRepoFiles,
  readRepoFile,
  searchRepoCode,
  getGitLog,
  getGitCommitDiff,
  getGitContributors,
  getRepoSummary,
  findRepoImages,
} = require('../lib/repos');
const {
  listContextDocuments,
  readContextDocument,
} = require('../lib/context');

function textResult(value) {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(value, null, 2),
    }],
  };
}

function errorResult(message) {
  return {
    content: [{ type: 'text', text: `Error: ${message}` }],
    isError: true,
  };
}

function requireValue(value, message) {
  if (value === null || value === undefined) return errorResult(message);
  if (value && typeof value === 'object' && value.error) return errorResult(value.error);
  return null;
}

const langSchema = z.enum(['en', 'de']).optional();

function registerTools(server, { scope = 'public' } = {}) {
  server.registerTool('list_projects', {
    title: 'List portfolio projects',
    description: 'List all portfolio projects with IDs, names, taglines, technologies, stats and document counts. Filter by category, status, technology, role, source type, AI usage or free-text query. Use this first.',
    inputSchema: {
      q: z.string().optional(),
      category: z.string().optional(),
      status: z.string().optional(),
      technology: z.string().optional(),
      role: z.string().optional(),
      sourceType: z.string().optional(),
      aiUsage: z.string().optional(),
      lang: langSchema,
      limit: z.number().int().min(1).max(200).optional(),
      offset: z.number().int().min(0).optional(),
    },
  }, async (args) => textResult(listProjects(args)));

  server.registerTool('get_project', {
    title: 'Get project details',
    description: 'Get complete metadata for one project by ID, including purpose, strengths, limitations, roadmap, repositories, documents, assets, statistics and deep links. Set includeRepoDetails for per-repository hashes, LOC and author data.',
    inputSchema: {
      projectId: z.string().min(1),
      lang: langSchema,
      includeRepoDetails: z.boolean().optional(),
    },
  }, async ({ projectId, lang, includeRepoDetails }) => {
    const project = getProject(projectId, {
      lang: lang || 'en',
      includeRepoDetails: scope === 'private' && Boolean(includeRepoDetails),
    });
    if (!project) return errorResult(`Project '${projectId}' not found.`);
    return textResult(project);
  });

  server.registerTool('list_documents', {
    title: 'List project documents',
    description: 'List downloadable project documents (PDF, Markdown) for one project or across all projects, including sizes and download/text URLs.',
    inputSchema: {
      projectId: z.string().optional(),
      lang: langSchema,
    },
  }, async ({ projectId, lang }) => {
    if (projectId && !getProject(projectId, { lang: lang || 'en', includeRepoDetails: false })) {
      return errorResult(`Project '${projectId}' not found.`);
    }
    return textResult(listDocuments({ projectId: projectId || null, lang: lang || 'en' }));
  });

  server.registerTool('read_document', {
    title: 'Read a project document',
    description: 'Read the text of a project document. Markdown is returned directly; PDFs are converted to text server-side. Supports offset/maxChars pagination and a single PDF page. Returns the public download URL too.',
    inputSchema: {
      projectId: z.string().min(1),
      file: z.string().min(1),
      offset: z.number().int().min(0).optional(),
      maxChars: z.number().int().min(1000).max(200000).optional(),
      page: z.number().int().min(1).optional(),
    },
  }, async ({ projectId, file, offset, maxChars, page }) => {
    const result = readDocumentText(projectId, file, { offset, maxChars, page });
    if (!result) return errorResult(`Document '${file}' not found in project '${projectId}'.`);
    return textResult(result);
  });

  server.registerTool('get_assets', {
    title: 'Get project assets',
    description: 'Get the logo and screenshot URLs for a project, with ready-to-use Markdown snippets.',
    inputSchema: {
      projectId: z.string().min(1),
      lang: langSchema,
    },
  }, async ({ projectId, lang }) => {
    const project = getProject(projectId, { lang: lang || 'en', includeRepoDetails: false });
    if (!project) return errorResult(`Project '${projectId}' not found.`);
    return textResult({
      projectId: project.id,
      name: project.name,
      logo: project.assets.logo,
      screenshots: project.assets.screenshots,
      readyToUse: project.assets.readyToUse,
    });
  });

  server.registerTool('search', {
    title: 'Search projects and documents',
    description: 'Search project metadata and document text. Returns matching projects and document snippets with links.',
    inputSchema: {
      q: z.string().min(2),
      lang: langSchema,
      limit: z.number().int().min(1).max(50).optional(),
    },
  }, async ({ q, lang, limit }) => {
    const max = limit || 20;
    const projects = listProjects({ q, lang: lang || 'en', limit: max }).projects;
    const documents = searchDocuments(q, { lang: lang || 'en', limit: max });
    return textResult({
      query: q,
      projectCount: projects.length,
      documentCount: documents.length,
      projects,
      documents,
    });
  });

  server.registerTool('get_profile', {
    title: 'Get portfolio profile',
    description: 'Get Christian F. Brinkmann’s portfolio profile, tagline, description and contact links.',
    inputSchema: {},
  }, async () => textResult(getProfileData()));

  server.registerTool('get_stats', {
    title: 'Get project statistics',
    description: 'Get Git and lines-of-code statistics. Omit projectId for the full stats file, or pass a project ID for one project with per-repository details.',
    inputSchema: {
      projectId: z.string().optional(),
    },
  }, async ({ projectId }) => {
    if (!projectId) return textResult(getStatsData());
    const stats = getStatsForProject(projectId);
    if (!stats) return errorResult(`Project '${projectId}' not found.`);
    return textResult(stats);
  });

  server.registerTool('get_activity', {
    title: 'Get Git activity',
    description: 'Get the Git contribution activity calendar data used by the portfolio.',
    inputSchema: {},
  }, async () => textResult(getActivityData()));

  if (scope !== 'private') return;

  server.registerTool('list_repos', {
    title: 'List repositories',
    description: 'List locally cloned repositories available for code browsing, including their source and public URL.',
    inputSchema: {},
  }, async () => {
    const repos = listRepos();
    return textResult({ count: repos.length, repos });
  });

  server.registerTool('list_repo_files', {
    title: 'List repository files',
    description: 'List files and folders inside a repository, up to 100 entries. Image entries include a renderable image URL.',
    inputSchema: {
      repoName: z.string().min(1),
      subDirectory: z.string().optional(),
    },
  }, async ({ repoName, subDirectory }) => {
    const result = listRepoFiles(repoName, subDirectory || '');
    const error = requireValue(result, `Repository '${repoName}' not found.`);
    return error || textResult(result);
  });

  server.registerTool('read_repo_file', {
    title: 'Read a repository file',
    description: 'Read a text file from a repository, capped at 500 lines. Image files return a renderable URL instead of binary content.',
    inputSchema: {
      repoName: z.string().min(1),
      filePath: z.string().min(1),
      startLine: z.number().int().min(1).optional(),
      lineCount: z.number().int().min(1).max(500).optional(),
    },
  }, async ({ repoName, filePath, startLine, lineCount }) => {
    const result = readRepoFile(repoName, filePath, { startLine, lineCount });
    const error = requireValue(result, `Repository '${repoName}' not found.`);
    return error || textResult(result);
  });

  server.registerTool('search_repo_code', {
    title: 'Search repository code',
    description: 'Search text or symbols inside a repository and return matching file paths, line numbers, snippets and links.',
    inputSchema: {
      repoName: z.string().min(1),
      searchTerm: z.string().min(2),
      maxResults: z.number().int().min(1).max(50).optional(),
    },
  }, async ({ repoName, searchTerm, maxResults }) => {
    const result = searchRepoCode(repoName, searchTerm, { maxResults });
    const error = requireValue(result, `Repository '${repoName}' not found.`);
    return error || textResult(result);
  });

  server.registerTool('get_git_log', {
    title: 'Get repository Git log',
    description: 'Get recent commits for a repository, including hashes, dates, authors, emails, subjects and commit URLs.',
    inputSchema: {
      repoName: z.string().min(1),
      maxCommits: z.number().int().min(1).max(50).optional(),
      filePath: z.string().optional(),
      author: z.string().optional(),
    },
  }, async ({ repoName, maxCommits, filePath, author }) => {
    const result = getGitLog(repoName, { maxCommits, filePath, author });
    const error = requireValue(result, `Repository '${repoName}' not found.`);
    return error || textResult(result);
  });

  server.registerTool('get_git_commit_diff', {
    title: 'Get commit diff',
    description: 'Inspect a specific commit in a repository, returning the commit stat and a diff capped at 500 lines.',
    inputSchema: {
      repoName: z.string().min(1),
      commitHash: z.string().min(1),
      filePath: z.string().optional(),
    },
  }, async ({ repoName, commitHash, filePath }) => {
    const result = getGitCommitDiff(repoName, commitHash, { filePath });
    const error = requireValue(result, `Repository '${repoName}' not found.`);
    return error || textResult(result);
  });

  server.registerTool('get_git_contributors', {
    title: 'Get repository contributors',
    description: 'List contributors to a repository with commit counts, names and email addresses.',
    inputSchema: {
      repoName: z.string().min(1),
    },
  }, async ({ repoName }) => {
    const result = getGitContributors(repoName);
    const error = requireValue(result, `Repository '${repoName}' not found.`);
    return error || textResult(result);
  });

  server.registerTool('get_codebase_summary', {
    title: 'Get codebase summary',
    description: 'Get the pre-computed architectural and file-by-file summary for a repository. Optionally focus on a sub-path.',
    inputSchema: {
      repoName: z.string().min(1),
      subPath: z.string().optional(),
    },
  }, async ({ repoName, subPath }) => {
    const result = getRepoSummary(repoName, subPath || '');
    if (!result) return errorResult(`No precomputed summary found for '${repoName}'.`);
    return textResult(result);
  });

  server.registerTool('read_context', {
    title: 'Read personal context documents',
    description: 'List or read the authoritative personal context documents (bio, career notes, background). Omit documentName to list the catalog.',
    inputSchema: {
      documentName: z.string().optional(),
      offset: z.number().int().min(0).optional(),
      maxChars: z.number().int().min(1000).max(200000).optional(),
    },
  }, async ({ documentName, offset, maxChars }) => {
    if (!documentName) return textResult({ documents: listContextDocuments() });
    const result = readContextDocument(documentName, { offset, maxChars });
    if (!result) return errorResult(`Context document '${documentName}' not found.`);
    return textResult(result);
  });

  server.registerTool('find_repo_images', {
    title: 'Find repository images',
    description: 'Find image assets (screenshots, diagrams, schematics, logos) inside a repository and return renderable URLs and Markdown snippets.',
    inputSchema: {
      repoName: z.string().min(1),
      subDirectory: z.string().optional(),
      query: z.string().optional(),
      maxResults: z.number().int().min(1).max(50).optional(),
    },
  }, async ({ repoName, subDirectory, query, maxResults }) => {
    const result = findRepoImages(repoName, { subDirectory, query, maxResults });
    const error = requireValue(result, `Repository '${repoName}' not found.`);
    return error || textResult(result);
  });
}

module.exports = {
  registerTools,
};
