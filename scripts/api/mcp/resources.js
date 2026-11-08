const { ResourceTemplate } = require('@modelcontextprotocol/sdk/server/mcp.js');
const {
  getProject,
  getProjects,
  getProfileData,
  getStatsData,
  getActivityData,
} = require('../lib/projects');
const {
  listDocuments,
  readDocumentText,
} = require('../lib/documents');
const { listRepos } = require('../lib/repos');
const { listContextDocuments } = require('../lib/context');

function jsonContents(uri, value) {
  return {
    contents: [{
      uri: uri.href,
      mimeType: 'application/json',
      text: JSON.stringify(value, null, 2),
    }],
  };
}

function decodeVariable(value) {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function registerResources(server, { scope = 'public' } = {}) {
  server.registerResource(
    'profile',
    'portfolio://profile',
    {
      title: 'Portfolio profile',
      description: 'Portfolio header, tagline, description and contact links.',
      mimeType: 'application/json',
    },
    async (uri) => jsonContents(uri, getProfileData())
  );

  server.registerResource(
    'projects',
    'portfolio://projects',
    {
      title: 'Project catalog',
      description: 'Compact list of all portfolio projects.',
      mimeType: 'application/json',
    },
    async (uri) => jsonContents(uri, getProjects().map((project) => ({
      id: project.id,
      name: project.name,
      tagline: project.tagline,
      category: project.category,
      status: project.status,
      year: project.year,
      technologies: project.technologies,
      documentCount: project.documentCount,
      portfolioUrl: project.portfolioUrl,
    })))
  );

  server.registerResource(
    'project',
    new ResourceTemplate('portfolio://projects/{projectId}', { list: undefined }),
    {
      title: 'Project details',
      description: 'Complete metadata for one project.',
      mimeType: 'application/json',
    },
    async (uri, variables) => {
      const projectId = decodeVariable(variables.projectId);
      const project = getProject(projectId, { includeRepoDetails: scope === 'private' });
      if (!project) {
        return {
          contents: [{
            uri: uri.href,
            mimeType: 'text/plain',
            text: `Project '${projectId}' not found.`,
          }],
        };
      }
      return jsonContents(uri, project);
    }
  );

  server.registerResource(
    'project-documents',
    new ResourceTemplate('portfolio://projects/{projectId}/documents', { list: undefined }),
    {
      title: 'Project documents',
      description: 'Document manifest for one project.',
      mimeType: 'application/json',
    },
    async (uri, variables) => {
      const projectId = decodeVariable(variables.projectId);
      return jsonContents(uri, listDocuments({ projectId }));
    }
  );

  server.registerResource(
    'project-document',
    new ResourceTemplate('portfolio://projects/{projectId}/documents/{file}', { list: undefined }),
    {
      title: 'Project document text',
      description: 'Extracted text of a project document (Markdown or PDF).',
      mimeType: 'text/plain',
    },
    async (uri, variables) => {
      const projectId = decodeVariable(variables.projectId);
      const file = decodeVariable(variables.file);
      const result = readDocumentText(projectId, file, { maxChars: 200000 });
      if (!result) {
        return {
          contents: [{
            uri: uri.href,
            mimeType: 'text/plain',
            text: `Document '${file}' not found in project '${projectId}'.`,
          }],
        };
      }
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'text/plain',
          text: result.text,
        }],
      };
    }
  );

  server.registerResource(
    'stats',
    'portfolio://stats',
    {
      title: 'Project statistics',
      description: 'Git and lines-of-code statistics.',
      mimeType: 'application/json',
    },
    async (uri) => jsonContents(uri, getStatsData())
  );

  server.registerResource(
    'activity',
    'portfolio://activity',
    {
      title: 'Git activity',
      description: 'Git contribution activity calendar.',
      mimeType: 'application/json',
    },
    async (uri) => jsonContents(uri, getActivityData())
  );

  if (scope !== 'private') return;

  server.registerResource(
    'repos',
    'portfolio://repos',
    {
      title: 'Repositories',
      description: 'Locally cloned repositories available for code browsing.',
      mimeType: 'application/json',
    },
    async (uri) => jsonContents(uri, listRepos())
  );

  server.registerResource(
    'context',
    'portfolio://context',
    {
      title: 'Personal context documents',
      description: 'Catalog of personal context documents.',
      mimeType: 'application/json',
    },
    async (uri) => jsonContents(uri, listContextDocuments())
  );
}

module.exports = {
  registerResources,
};
