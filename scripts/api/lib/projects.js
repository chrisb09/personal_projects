const fs = require('fs');
const path = require('path');
const {
  projectsDir,
  projectsDeFile,
  headerFile,
  statsFile,
  activityFile,
  projectImagesDir,
  projectDocumentsDir,
  publicBaseUrl,
  apiBaseUrl,
} = require('./paths');

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
const jsonCache = new Map();

function readJsonCached(file, fallback) {
  try {
    const stat = fs.statSync(file);
    const cached = jsonCache.get(file);
    if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
      return cached.data;
    }
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    jsonCache.set(file, { mtimeMs: stat.mtimeMs, size: stat.size, data });
    return data;
  } catch {
    return fallback;
  }
}

function readProjectsDe() {
  return readJsonCached(projectsDeFile, {});
}

function listProjectFolders() {
  try {
    return fs.readdirSync(projectsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

function findProjectFolder(projectId) {
  if (!projectId || typeof projectId !== 'string') return null;
  const clean = projectId.trim();
  if (!clean || clean.includes('..') || /[\\/]/.test(clean)) return null;

  const direct = path.join(projectsDir, clean);
  if (fs.existsSync(path.join(direct, 'project.json'))) return clean;

  const match = listProjectFolders().find((folder) => folder.toLowerCase() === clean.toLowerCase());
  return match || null;
}

function absoluteUrl(webPath) {
  if (!webPath) return null;
  if (/^https?:\/\//i.test(webPath)) return webPath;
  return `${publicBaseUrl}${webPath.startsWith('/') ? '' : '/'}${webPath}`;
}

function projectDeepLink(projectId, tab) {
  const url = new URL(publicBaseUrl);
  url.searchParams.set('project', projectId);
  if (tab) url.searchParams.set('tab', tab);
  return url.toString();
}

function getProjectImages(projectDir, folderName, projectData) {
  const screenshots = [];
  const seen = new Set();

  const add = (value) => {
    if (typeof value !== 'string') return;
    const clean = value.trim();
    if (!clean || seen.has(clean)) return;
    seen.add(clean);
    screenshots.push(clean);
  };

  const mediaDir = path.join(projectDir, 'media');
  if (fs.existsSync(mediaDir)) {
    try {
      const files = fs.readdirSync(mediaDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.includes(path.extname(entry.name).toLowerCase()))
        .map((entry) => entry.name)
        .sort();
      for (const file of files) {
        add(`/images/projects/${encodeURIComponent(folderName)}/${encodeURIComponent(file)}`);
      }
    } catch {
      // Ignore unreadable media directories.
    }
  }

  if (Array.isArray(projectData.screenshots)) {
    for (const screenshot of projectData.screenshots) add(screenshot);
  }

  let logo = null;
  for (const ext of IMAGE_EXTENSIONS) {
    const logoFile = path.join(projectDir, `logo${ext}`);
    try {
      if (fs.existsSync(logoFile) && fs.statSync(logoFile).isFile()) {
        logo = `/images/projects/${encodeURIComponent(folderName)}/logo${ext}`;
        break;
      }
    } catch {
      // Ignore unreadable logo candidates.
    }
  }
  if (!logo && typeof projectData.logo === 'string') logo = projectData.logo.trim() || null;

  const absoluteScreenshots = screenshots.slice(0, 24).map(absoluteUrl);
  const absoluteLogo = absoluteUrl(logo);
  const label = String(projectData.name || folderName).replace(/[\[\]\r\n]+/g, ' ').trim() || folderName;
  const readyToUse = [];
  if (absoluteLogo) readyToUse.push(`![${label} logo](${absoluteLogo})`);
  for (const screenshot of absoluteScreenshots.slice(0, 6)) {
    readyToUse.push(`![${label} screenshot](${screenshot})`);
  }

  return {
    logo: absoluteLogo,
    screenshots: absoluteScreenshots,
    readyToUse,
  };
}

function getProjectDocuments(projectDir, folderName, projectData) {
  if (!Array.isArray(projectData.documents)) return [];

  return projectData.documents.map((doc) => {
    const files = (Array.isArray(doc.files) ? doc.files : []).map((file) => {
      const sourceName = String(file.file || '').trim();
      const safeName = path.basename(sourceName);
      if (!safeName || safeName !== sourceName) return null;

      const publicPath = path.join(projectDocumentsDir, folderName, safeName);
      const configPath = path.join(projectDir, 'documents', safeName);
      const resolvedPath = fs.existsSync(publicPath) ? publicPath : (fs.existsSync(configPath) ? configPath : null);
      let size = null;
      if (resolvedPath) {
        try {
          size = fs.statSync(resolvedPath).size;
        } catch {
          size = null;
        }
      }

      const apiUrl = `${apiBaseUrl}/projects/${encodeURIComponent(folderName)}/documents/${encodeURIComponent(safeName)}`;
      return {
        file: safeName,
        format: file.format || 'other',
        size,
        available: Boolean(resolvedPath),
        downloadUrl: `${publicBaseUrl}/documents/projects/${encodeURIComponent(folderName)}/${encodeURIComponent(safeName)}`,
        apiUrl,
        textUrl: `${apiUrl}/text`,
      };
    }).filter(Boolean);

    return {
      title: doc.title || files[0]?.file || 'Document',
      description: doc.description || '',
      date: doc.date || null,
      files,
    };
  });
}

function applyTranslation(project, translation) {
  if (!translation) return project;

  const translated = {
    ...project,
    name: translation.name || project.name,
    tagline: translation.tagline || project.tagline,
    description: translation.description || project.description,
    purpose: translation.purpose || project.purpose,
    strengths: Array.isArray(translation.strengths) && translation.strengths.length > 0 ? translation.strengths : project.strengths,
    limitations: Array.isArray(translation.limitations) && translation.limitations.length > 0 ? translation.limitations : project.limitations,
    expertise: Array.isArray(translation.expertise) && translation.expertise.length > 0 ? translation.expertise : project.expertise,
    roadmap: Array.isArray(translation.roadmap) && translation.roadmap.length > 0 ? translation.roadmap : project.roadmap,
  };

  if (Array.isArray(project.relatedProjects)) {
    translated.relatedProjects = project.relatedProjects.map((related, index) => {
      const translatedItem = Array.isArray(translation.relatedProjects)
        ? translation.relatedProjects.find((item) => item && item.index === index)
        : null;
      const translatedValue = translatedItem?.relation
        || translation.relatedProjects?.[index]?.relation
        || translation.relatedProjects?.[index];
      if (!translatedValue) return related;
      return {
        ...related,
        relation: typeof translatedValue === 'string' ? translatedValue : (translatedValue.relation || related.relation),
      };
    });
  }

  for (const field of ['repos', 'mirrors', 'modelReleases']) {
    if (!Array.isArray(project[field])) continue;
    translated[field] = project[field].map((item, index) => {
      const translatedItem = Array.isArray(translation[field])
        ? translation[field].find((entry) => entry && entry.index === index)
        : null;
      const translatedDescription = translatedItem?.description
        || translation[field]?.[index]?.description
        || (typeof translation[field]?.[index] === 'string' ? translation[field][index] : null);
      return translatedDescription ? { ...item, description: translatedDescription } : item;
    });
  }

  return translated;
}

function getStatsData() {
  return readJsonCached(statsFile, { lastUpdated: null, projects: {} });
}

function getActivityData() {
  return readJsonCached(activityFile, { updatedAt: null, days: [] });
}

function getProfileData() {
  const profile = readJsonCached(headerFile, {});
  return {
    ...profile,
    portfolioUrl: publicBaseUrl,
  };
}

function buildProject(folderName, { lang = 'en', includeRepoDetails = false } = {}) {
  const projectDir = path.join(projectsDir, folderName);
  const projectFile = path.join(projectDir, 'project.json');
  let projectData;
  try {
    projectData = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
  } catch {
    return null;
  }

  const id = projectData.id || folderName;
  const translations = lang === 'de' ? readProjectsDe() : {};
  const translation = translations[id] || translations[folderName];
  const images = getProjectImages(projectDir, folderName, projectData);
  let project = {
    ...projectData,
    id,
    screenshots: images.screenshots,
    logo: images.logo,
  };

  if (lang === 'de') project = applyTranslation(project, translation);

  const statsData = getStatsData();
  const statsEntry = statsData.projects?.[id] || statsData.projects?.[folderName];
  if (statsEntry) {
    project.stats = statsEntry.stats || project.stats;
    project.loc = statsEntry.loc || project.loc;
    if (includeRepoDetails) project.repoDetails = statsEntry;
  }
  project.statsLastUpdated = statsData.lastUpdated || null;

  const documents = getProjectDocuments(projectDir, folderName, projectData);
  project.documents = documents;
  project.documentCount = documents.length;
  project.assets = images;
  project.portfolioUrl = projectDeepLink(id);
  project.apiUrl = `${apiBaseUrl}/projects/${encodeURIComponent(id)}`;
  project.documentsUrl = `${project.apiUrl}/documents`;
  project.assetsUrl = `${project.apiUrl}/assets`;

  if (Array.isArray(project.relatedProjects)) {
    project.relatedProjects = project.relatedProjects.map((related) => {
      if (!related.projectId) return related;
      const relatedFolder = findProjectFolder(related.projectId);
      if (!relatedFolder) return related;
      const relatedFile = path.join(projectsDir, relatedFolder, 'project.json');
      const relatedData = readJsonCached(relatedFile, null);
      return {
        ...related,
        projectName: relatedData?.name || related.projectId,
        projectUrl: projectDeepLink(related.projectId),
      };
    });
  }

  return project;
}

function getProjects({ lang = 'en', includeRepoDetails = false } = {}) {
  const projects = [];
  for (const folder of listProjectFolders()) {
    const project = buildProject(folder, { lang, includeRepoDetails });
    if (project) projects.push(project);
  }
  return projects;
}

function getProject(projectId, { lang = 'en', includeRepoDetails = true } = {}) {
  const folder = findProjectFolder(projectId);
  if (!folder) return null;
  return buildProject(folder, { lang, includeRepoDetails });
}

function matchesQuery(project, query) {
  if (!query) return true;
  const haystack = [
    project.id,
    project.name,
    project.tagline,
    project.description,
    project.purpose,
    ...(project.technologies || []),
    ...(project.expertise || []),
    ...(project.strengths || []),
    ...(project.limitations || []),
    ...(project.roadmap || []),
    ...(project.repos || []).map((repo) => repo.name),
  ].join('\n').toLowerCase();
  return haystack.includes(query);
}

function listProjects({
  lang = 'en',
  q = '',
  category = '',
  status = '',
  technology = '',
  role = '',
  sourceType = '',
  aiUsage = '',
  limit = 100,
  offset = 0,
} = {}) {
  const query = String(q || '').trim().toLowerCase();
  const tech = String(technology || '').trim().toLowerCase();
  const max = Math.min(200, Math.max(1, parseInt(limit, 10) || 100));
  const skip = Math.max(0, parseInt(offset, 10) || 0);

  const filtered = getProjects({ lang }).filter((project) => {
    if (category && String(project.category).toLowerCase() !== String(category).toLowerCase()) return false;
    if (status && String(project.status).toLowerCase() !== String(status).toLowerCase()) return false;
    if (role && String(project.role).toLowerCase() !== String(role).toLowerCase()) return false;
    if (sourceType && String(project.sourceType).toLowerCase() !== String(sourceType).toLowerCase()) return false;
    if (aiUsage && String(project.aiUsage).toLowerCase() !== String(aiUsage).toLowerCase()) return false;
    if (tech && !(project.technologies || []).some((item) => String(item).toLowerCase().includes(tech))) return false;
    return matchesQuery(project, query);
  });

  const items = filtered.slice(skip, skip + max).map((project) => ({
    id: project.id,
    name: project.name,
    tagline: project.tagline,
    year: project.year,
    category: project.category,
    status: project.status,
    projectType: project.projectType,
    academic: project.academic,
    role: project.role,
    sourceType: project.sourceType,
    aiUsage: project.aiUsage,
    aiUtilization: project.aiUtilization,
    technologies: project.technologies,
    stats: project.stats,
    loc: project.loc,
    documentCount: project.documentCount,
    hasDocuments: project.documentCount > 0,
    portfolioUrl: project.portfolioUrl,
    apiUrl: project.apiUrl,
    description: String(project.description || '').slice(0, 300),
  }));

  return {
    count: filtered.length,
    offset: skip,
    limit: max,
    projects: items,
  };
}

function getStatsForProject(projectId) {
  const folder = findProjectFolder(projectId);
  if (!folder) return null;
  const project = buildProject(folder, { includeRepoDetails: true });
  if (!project) return null;
  return {
    projectId: project.id,
    lastUpdated: project.statsLastUpdated,
    stats: project.stats || null,
    loc: project.loc || null,
    repoDetails: project.repoDetails || null,
  };
}

module.exports = {
  readJsonCached,
  readProjectsDe,
  listProjectFolders,
  findProjectFolder,
  absoluteUrl,
  projectDeepLink,
  getProjectImages,
  getProjectDocuments,
  getStatsData,
  getActivityData,
  getProfileData,
  getProjects,
  getProject,
  listProjects,
  getStatsForProject,
};
