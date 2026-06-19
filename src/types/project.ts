export interface Project {
  id: string;
  name: string;
  tagline: string;
  year: string;
  category: 'backend' | 'frontend' | 'devops-infrastructure' | 'data-scraping' | 'library' | 'package-management' | 'cli' | 'fullstack' | 'utility' | 'other';
  status: 'active' | 'experimental' | 'maintenance' | 'archived';
  projectType?: 'software-project' | 'script-small' | '3d-printing' | 'it-project' | 'academic-project';
  excludeFromStats?: boolean;
  
  // Role - your involvement with the project
  role: 'main-author' | 'contributor' | 'fork-maintainer';
  
  // Source type - open or closed source (displayed as label)
  sourceType: 'open-source' | 'closed-source';
  
  // AI Usage level - how it was built
  aiUsage: 'none' | 'minor' | 'major' | 'full';
  
  // AI Utilization - does the project itself use AI
  aiUtilization: 'ai-powered' | 'ai-enhanced' | 'no-ai';
  
  // Overview
  description: string;
  purpose: string;
  
  // Technical details
  technologies: string[];
  dependencies: string[];
  expertise: string[];
  
  // Strengths & limitations
  strengths: string[];
  limitations: string[];
  
  // Usage
  installation?: string;
  usage?: string;
  
  // Future
  roadmap: string[];
  
  // Links & media
  demoUrl?: string;
  repos?: {
    name: string;
    url: string;
    type?: 'github' | 'gitlab' | 'gitea' | 'other';
  }[];
  mirrors?: {
    name: string;
    url: string;
    type?: 'github' | 'gitlab' | 'gitea' | 'other';
    description?: string;
  }[];
  docsUrl?: string;
  screenshots?: string[];
  logo?: string;
  
  // Related projects (both external links and internal project IDs)
  relatedProjects?: {
    name: string;
    relation: string;
    url?: string;
    projectId?: string; // Reference to another project on this page by ID
  }[];
  
  // GitHub/GitLab stats (populated by external script via stats.json)
  stats?: {
    stars?: number;
    commits?: number;
    branches?: number;
    lastCommit?: string;
  };
  
  // Lines of code per language (populated by external script via stats.json)
  loc?: {
    total?: number;
    byLanguage?: Record<string, number>;
  };
}

export type ProjectCategory = Project['category'];
export type ProjectStatus = Project['status'];
export type ProjectRole = Project['role'];
export type ProjectSourceType = Project['sourceType'];
export type AIUsage = Project['aiUsage'];
export type AIUtilization = Project['aiUtilization'];
export type ProjectType = NonNullable<Project['projectType']>;

export const projectTypeLabels: Record<ProjectType, string> = {
  'software-project': 'Projects',
  'script-small': 'Scripts and Small Projects',
  '3d-printing': '3D Printing',
  'it-project': 'IT Projects',
  'academic-project': 'Academic Projects',
};

export const categoryLabels: Record<ProjectCategory, string> = {
  backend: 'Backend',
  frontend: 'Frontend',
  'devops-infrastructure': 'DevOps & Infrastructure',
  'data-scraping': 'Data & Scraping',
  library: 'Library',
  'package-management': 'Package Management',
  cli: 'CLI Tool',
  fullstack: 'Full Stack',
  utility: 'Utility & Tools',
  other: 'Other',
};

export const statusLabels: Record<ProjectStatus, string> = {
  active: 'Active',
  experimental: 'Experimental',
  maintenance: 'Maintenance',
  archived: 'Archived',
};

export const roleLabels: Record<ProjectRole, string> = {
  'main-author': 'Main Author',
  contributor: 'Contributor',
  'fork-maintainer': 'Fork Maintainer',
};

export const sourceTypeLabels: Record<ProjectSourceType, string> = {
  'open-source': 'Open Source',
  'closed-source': 'Closed Source',
};

export const aiUsageLabels: Record<AIUsage, string> = {
  none: 'No AI',
  minor: 'AI Assisted',
  major: 'AI Generated',
  full: 'AI Built',
};

export const aiUsageDescriptions: Record<AIUsage, string> = {
  none: 'Built entirely without AI assistance',
  minor: 'Used AI for autocompletion and chat assistance only',
  major: 'Significant portions generated or assisted by AI agents',
  full: 'Primarily or entirely built using AI tools',
};

export const aiUtilizationLabels: Record<AIUtilization, string> = {
  'ai-powered': 'AI Powered',
  'ai-enhanced': 'AI Enhanced',
  'no-ai': 'No AI Features',
};

export const aiUtilizationDescriptions: Record<AIUtilization, string> = {
  'ai-powered': 'Core functionality relies on AI/ML models',
  'ai-enhanced': 'Uses AI to augment certain features',
  'no-ai': 'Does not use AI or machine learning',
};

export const categoryColors: Record<ProjectCategory, string> = {
  backend: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
  frontend: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400',
  'devops-infrastructure': 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400',
  'data-scraping': 'bg-pink-500/10 text-pink-600 border-pink-500/20 dark:text-pink-400',
  library: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400',
  'package-management': 'bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400',
  cli: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  fullstack: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400',
  utility: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400',
  other: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400',
};

export const roleColors: Record<ProjectRole, string> = {
  'main-author': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
  contributor: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  'fork-maintainer': 'bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400',
};

export const sourceTypeColors: Record<ProjectSourceType, string> = {
  'open-source': 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400',
  'closed-source': 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
};

export const aiUsageColors: Record<AIUsage, string> = {
  none: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400',
  minor: 'bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400',
  major: 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20 dark:text-fuchsia-400',
  full: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400',
};

export const aiUtilizationColors: Record<AIUtilization, string> = {
  'ai-powered': 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400',
  'ai-enhanced': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400',
  'no-ai': 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400',
};

// Language colors for LOC charts
export const languageColors: Record<string, string> = {
  Java: '#b07219',
  Python: '#3572A5',
  'JavaScript': '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Bash: '#89e051',
  Shell: '#89e051',
  Go: '#00ADD8',
  Rust: '#dea584',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Swift: '#ffac45',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  SQL: '#e38c00',
  YAML: '#cb171e',
  JSON: '#292929',
  Docker: '#384d54',
  Markdown: '#083fa1',
};
