const fs = require('fs');
const path = require('path');

const projectsDir = path.join(__dirname, '../config/projects');
const outputTsPath = path.join(__dirname, '../src/config/projects.ts');
const publicImagesDir = path.join(__dirname, '../public/images/projects');
const localesSrcDir = path.join(__dirname, '../src/locales');
const publicLocalesDir = path.join(__dirname, '../public/locales');

// Helper to copy directory recursively
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function compileProjects() {
  if (!fs.existsSync(projectsDir)) {
    console.error(`Projects directory not found at ${projectsDir}`);
    process.exit(1);
  }

  // Ensure public locales are in sync
  if (fs.existsSync(localesSrcDir)) {
    copyDirSync(localesSrcDir, publicLocalesDir);
    console.log(`Copied locales to ${publicLocalesDir}`);
  }

  const compiledProjects = [];
  const items = fs.readdirSync(projectsDir);
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];

  for (const item of items) {
    const itemPath = path.join(projectsDir, item);
    const stat = fs.statSync(itemPath);

    if (!stat.isDirectory()) {
      continue;
    }

    const projectId = item;
    const jsonPath = path.join(itemPath, 'project.json');
    if (!fs.existsSync(jsonPath)) {
      console.warn(`No project.json found in folder: config/projects/${item}`);
      continue;
    }

    const projectData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    let projectMediaDir = null;
    let projectLogoPath = null;

    // Look for media folder
    const mediaDir = path.join(itemPath, 'media');
    if (fs.existsSync(mediaDir)) {
      projectMediaDir = mediaDir;
    }

    // Look for logo file inside the directory
    for (const ext of imageExtensions) {
      const logoFile = path.join(itemPath, `logo${ext}`);
      if (fs.existsSync(logoFile)) {
        projectLogoPath = logoFile;
        break;
      }
    }

    if (projectData) {
      // Handle project-specific media
      if (projectMediaDir) {
        const destMediaDir = path.join(publicImagesDir, projectId);
        
        // Clean existing target dir if it exists
        if (fs.existsSync(destMediaDir)) {
          fs.rmSync(destMediaDir, { recursive: true, force: true });
        }
        
        // Copy files to public/images/projects/<projectId>/
        copyDirSync(projectMediaDir, destMediaDir);
        console.log(`Copied media assets for ${projectId} to public/images/projects/${projectId}/`);
        
        // Get list of copied image files (filtering for common image extensions)
        const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const mediaFiles = fs.readdirSync(projectMediaDir)
          .filter(file => mediaExtensions.includes(path.extname(file).toLowerCase()))
          .sort(); // Sort to keep order consistent
        
        // Set screenshots dynamically in the project object
        projectData.screenshots = mediaFiles.map(file => `/images/projects/${projectId}/${file}`);
      }

      // Handle project logo if specified
      if (projectLogoPath) {
        const logoExt = path.extname(projectLogoPath);
        const logoDestPath = path.join(publicImagesDir, projectId, `logo${logoExt}`);
        const webLogoPath = `/images/projects/${projectId}/logo${logoExt}`;

        // Ensure target directory exists and copy the file
        fs.mkdirSync(path.dirname(logoDestPath), { recursive: true });
        fs.copyFileSync(projectLogoPath, logoDestPath);
        console.log(`Copied logo for ${projectId} to ${logoDestPath}`);
        
        projectData.logo = webLogoPath;
      }

      compiledProjects.push(projectData);
    }
  }

  // Define helper functions template
  const helpersCode = `
// Helper functions for filtering and sorting
export function getProjectsByCategory(category: string) {
  return projects.filter(p => p.category === category);
}

export function getProjectsByStatus(status: string) {
  return projects.filter(p => p.status === status);
}

export function getActiveProjects() {
  return projects.filter(p => p.status === 'active');
}

export function getProjectById(id: string) {
  return projects.find(p => p.id === id);
}

export function getAllCategories() {
  return [...new Set(projects.map(p => p.category))];
}

// Get projects by role
export function getProjectsByRole(role: string) {
  return projects.filter(p => p.role === role);
}

// Get main author projects only
export function getMainAuthorProjects() {
  return projects.filter(p => p.role === 'main-author');
}

// Calculate aggregate stats
export function getAggregateStats() {
  const ownProjects = getMainAuthorProjects();
  return {
    totalStars: ownProjects.reduce((sum, p) => sum + (p.stats?.stars || 0), 0),
    totalCommits: projects.reduce((sum, p) => sum + (p.stats?.commits || 0), 0),
    totalLOC: projects.reduce((sum, p) => sum + (p.loc?.total || 0), 0),
  };
}

// Get LOC by language across all projects
export function getLOCAggregateByLanguage(): Record<string, number> {
  const aggregate: Record<string, number> = {};
  
  projects.forEach(project => {
    if (project.loc?.byLanguage) {
      Object.entries(project.loc.byLanguage).forEach(([lang, count]) => {
        aggregate[lang] = (aggregate[lang] || 0) + count;
      });
    }
  });
  
  return aggregate;
}
`;

  // Construct complete TypeScript code
  const tsContent = `import type { Project } from '@/types/project';\n\nexport const projects: Project[] = ${JSON.stringify(compiledProjects, null, 2)};\n${helpersCode}`;

  fs.writeFileSync(outputTsPath, tsContent, 'utf8');
  console.log(`Successfully compiled projects to: ${outputTsPath}`);
}

compileProjects();
