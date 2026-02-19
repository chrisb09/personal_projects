export interface Project {
  id: string;
  name: string;
  tagline: string;
  year: string;
  category: 'backend' | 'frontend' | 'devops' | 'opensource' | 'utility' | 'scraper';
  status: 'active' | 'experimental' | 'maintenance' | 'archived';
  
  // Project type - distinguishes full projects from contributions
  projectType: 'full' | 'contribution';
  
  // AI Usage level
  aiUsage: 'none' | 'minor' | 'major' | 'full';
  
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
export type ProjectType = Project['projectType'];
export type AIUsage = Project['aiUsage'];

export const categoryLabels: Record<ProjectCategory, string> = {
  backend: 'Backend',
  frontend: 'Frontend',
  devops: 'DevOps & Infrastructure',
  opensource: 'Open Source',
  utility: 'Utility & Tools',
  scraper: 'Data & Scraping',
};

export const statusLabels: Record<ProjectStatus, string> = {
  active: 'Active',
  experimental: 'Experimental',
  maintenance: 'Maintenance',
  archived: 'Archived',
};

export const projectTypeLabels: Record<ProjectType, string> = {
  full: 'Full Project',
  contribution: 'Contribution',
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

export const categoryColors: Record<ProjectCategory, string> = {
  backend: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  frontend: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  devops: 'bg-green-500/10 text-green-600 border-green-500/20',
  opensource: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  utility: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  scraper: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
};

export const projectTypeColors: Record<ProjectType, string> = {
  full: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  contribution: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

export const aiUsageColors: Record<AIUsage, string> = {
  none: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  minor: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  major: 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20',
  full: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
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
