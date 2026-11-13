export interface Project {
  id: string;
  name: string;
  tagline: string;
  year: string;
  category: 'backend' | 'frontend' | 'devops-infrastructure' | 'data-scraping' | 'library' | 'package-management' | 'cli' | 'fullstack' | 'utility' | 'other';
  status: 'active' | 'experimental' | 'maintenance' | 'archived' | 'completed';
  projectType?: 'software-project' | 'script-small' | '3d-printing' | 'it-project';
  academic?: boolean;
  excludeFromStats?: boolean;
  
  // Role - your involvement with the project
  role: 'main-author' | 'contributor' | 'fork-maintainer' | 'backend-co-lead' | 'project-lead';
  
  // Source type - open or closed source (displayed as label)
  sourceType: 'open-source' | 'closed-source';
  
  // AI Usage level - how it was built
  aiUsage: 'none' | 'minor' | 'contributed' | 'major' | 'full';
  
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
  liveUrl?: string;
  oldUrl?: string;
  repos?: {
    name: string;
    url: string;
    type?: 'github' | 'gitlab' | 'gitea' | 'other';
    excludeFirstCommit?: boolean;
    /** Private repository: still cloned for stats, but not rendered as a public link. */
    private?: boolean;
    /** Override the branch to check out before running LOC analysis (defaults to origin/HEAD). */
    branch?: string;
    /** Keep the repository visible and cloned without counting its commits or LOC. */
    excludeFromStats?: boolean;
    /** Repository-specific directories excluded from LOC analysis. */
    ignoreDirectories?: string[];
  }[];
  mirrors?: {
    name: string;
    url: string;
    type?: 'github' | 'gitlab' | 'gitea' | 'other';
    description?: string;
    private?: boolean;
  }[];
  modelReleases?: {
    name: string;
    url: string;
    type?: 'huggingface' | 'other';
    description?: string;
  }[];
  docsUrl?: string;
  screenshots?: string[];
  logo?: string;

  // Downloadable project documents (PDF, Markdown, ...)
  documents?: ProjectDocument[];
  
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

export type DocumentFormat = 'pdf' | 'markdown' | 'docx' | 'other';

export interface ProjectDocumentFile {
  /** Web path, rewritten by the compile script. */
  file: string;
  format: DocumentFormat;
  /** File size in bytes, computed by the compile script. */
  size?: number;
}

export interface ProjectDocument {
  title: string;
  description?: string;
  /** ISO date (YYYY-MM-DD) shown alongside the document. */
  date?: string;
  files: ProjectDocumentFile[];
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
  completed: 'Completed',
};

export const roleLabels: Record<ProjectRole, string> = {
  'main-author': 'Main Author',
  contributor: 'Contributor',
  'fork-maintainer': 'Fork Maintainer',
  'backend-co-lead': 'Backend Co-Lead',
  'project-lead': 'Project Lead',
};

export const sourceTypeLabels: Record<ProjectSourceType, string> = {
  'open-source': 'Open Source',
  'closed-source': 'Closed Source',
};

export const aiUsageLabels: Record<AIUsage, string> = {
  none: 'No AI',
  minor: 'AI Assisted',
  contributed: 'AI Contributed',
  major: 'AI Generated',
  full: 'AI Built',
};

export const aiUsageDescriptions: Record<AIUsage, string> = {
  none: 'Built entirely without AI assistance',
  minor: 'Used AI for autocompletion and chat assistance only',
  contributed: 'AI generated some features and/or tests',
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
  backend: 'bg-primary/10 text-primary border-primary/20',
  frontend: 'bg-gold/10 text-gold border-gold/20',
  'devops-infrastructure': 'bg-primary/10 text-primary border-primary/20',
  'data-scraping': 'bg-secondary text-secondary-foreground border-border',
  library: 'bg-primary/10 text-primary border-primary/20',
  'package-management': 'bg-gold/10 text-gold border-gold/20',
  cli: 'bg-gold/10 text-gold border-gold/20',
  fullstack: 'bg-primary/10 text-primary border-primary/20',
  utility: 'bg-secondary text-secondary-foreground border-border',
  other: 'bg-muted text-muted-foreground border-border',
};

export const roleColors: Record<ProjectRole, string> = {
  'main-author': 'bg-primary/10 text-primary border-primary/20',
  contributor: 'bg-gold/10 text-gold border-gold/20',
  'fork-maintainer': 'bg-secondary text-secondary-foreground border-border',
  'backend-co-lead': 'bg-primary/10 text-primary border-primary/20',
  'project-lead': 'bg-gold/10 text-gold border-gold/20',
};

export const sourceTypeColors: Record<ProjectSourceType, string> = {
  'open-source': 'bg-primary/10 text-primary border-primary/20',
  'closed-source': 'bg-secondary text-secondary-foreground border-border',
};

// Build-time AI involvement: green = human-made, yellow/orange = assisted,
// red = AI-generated with human supervision, purple = primarily AI-built.
export const aiUsageColors: Record<AIUsage, string> = {
  none: 'bg-primary/10 text-primary border-primary/25',
  minor: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/25 dark:text-yellow-400 dark:border-yellow-500/30',
  contributed: 'bg-orange-500/10 text-orange-700 border-orange-500/25 dark:text-orange-400 dark:border-orange-500/30',
  major: 'bg-rose-500/10 text-rose-700 border-rose-500/25 dark:text-rose-400 dark:border-rose-500/30',
  full: 'bg-violet-500/10 text-violet-700 border-violet-500/25 dark:text-violet-400 dark:border-violet-500/30',
};

export const aiUsageDotColors: Record<AIUsage, string> = {
  none: 'bg-primary',
  minor: 'bg-yellow-500',
  contributed: 'bg-orange-500',
  major: 'bg-rose-500',
  full: 'bg-violet-500',
};

export const aiUtilizationColors: Record<AIUtilization, string> = {
  'ai-powered': 'bg-gold/10 text-gold border-gold/20',
  'ai-enhanced': 'bg-primary/10 text-primary border-primary/20',
  'no-ai': 'bg-secondary text-secondary-foreground border-border',
};

export const aiUtilizationDotColors: Record<AIUtilization, string> = {
  'ai-powered': 'bg-gold',
  'ai-enhanced': 'bg-primary',
  'no-ai': 'bg-muted-foreground',
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
  'C/C++ Header': '#ff758f',
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
