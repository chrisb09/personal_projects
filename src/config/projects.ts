import type { Project } from '@/types/project';

/**
 * PROJECTS CONFIGURATION
 * 
 * This is the main configuration file for all your projects.
 * To add a new project, simply add a new object to the array below.
 * To modify a project, edit its corresponding object.
 * 
 * Each project supports:
 * - Basic info (name, tagline, year, category, status)
 * - projectType: 'full' for your own projects, 'contribution' for minor contributions
 * - aiUsage: 'none' | 'minor' | 'major' | 'full' - indicates AI involvement level
 * - Description and purpose
 * - Technologies, dependencies, expertise
 * - Strengths and limitations
 * - Installation and usage instructions
 * - Future roadmap items
 * - Links (demo, repo, docs)
 * - Screenshots (add paths to your images)
 * - Logo (add path to your logo image)
 * - Related projects
 * - stats: GitHub stats (stars, commits, branches, lastCommit) - populated by external script
 * - loc: Lines of code per language - populated by external script
 */

export const projects: Project[] = [
  {
    id: 'firecord',
    name: 'firecord',
    tagline: 'Experimental Redisson Alternative',
    year: '2023',
    category: 'backend',
    status: 'experimental',
    projectType: 'full',
    aiUsage: 'minor',
    
    description: 'Redis-based automatic, reference-based object synchronization for Java. A lightweight alternative to Redisson focused on performance and minimal network overhead.',
    purpose: 'To provide a more efficient solution for distributed object synchronization in Java applications, reducing latency and network load compared to existing solutions.',
    
    technologies: ['Java', 'Redis', 'AspectJ', 'Spring Framework'],
    dependencies: ['Redis 6.0+', 'AspectJ Weaver', 'Jedis or Lettuce client'],
    expertise: ['Distributed Systems', 'Object Synchronization', 'Aspect-Oriented Programming', 'Low-latency Networking'],
    
    strengths: [
      'Automatic object synchronization without manual intervention',
      'Reference-based tracking reduces memory overhead',
      'Significantly lower latency compared to Redisson',
      'Reduced network load through intelligent change detection',
      'Seamless integration with existing Java applications',
    ],
    limitations: [
      'Experimental status - API may change',
      'Limited to Redis backend (no other data stores)',
      'AspectJ instrumentation required',
      'Smaller community than established alternatives',
    ],
    
    installation: `// Add to your pom.xml
<dependency>
    <groupId>de.christianfbrinkmann</groupId>
    <artifactId>firecord</artifactId>
    <version>0.1.0-SNAPSHOT</version>
</dependency>

// Configure Redis connection
firecord:
  redis:
    host: localhost
    port: 6379`,
    
    usage: `// Annotate your shared objects
@Synchronized
public class SharedState {
    private String data;
    private int counter;
    
    // Getters and setters automatically synchronized
}

// Use in your application
SharedState state = firecord.get(SharedState.class, "state-id");
state.setData("Hello, distributed world!");
// Changes automatically propagated to all nodes`,
    
    roadmap: [
      'Add support for Redis Cluster and Sentinel',
      'Implement configurable consistency levels',
      'Create comprehensive benchmark suite',
      'Add Spring Boot starter for easier configuration',
      'Support for custom serialization strategies',
      'Add monitoring and metrics integration',
    ],
    
    demoUrl: undefined,
    repoUrl: undefined,
    docsUrl: undefined,
    screenshots: [],
    logo: undefined,
    
    relatedProjects: [
      { name: 'Redisson', relation: 'Inspiration and alternative to', url: 'https://redisson.org/' },
      { name: 'Redis', relation: 'Built on top of', url: 'https://redis.io/' },
    ],
    
    // Dummy stats - would be populated by external script
    stats: {
      stars: 12,
      commits: 47,
      branches: 3,
      lastCommit: '2024-01-15',
    },
    loc: {
      total: 8500,
      byLanguage: {
        Java: 7200,
        'XML': 800,
        YAML: 300,
        Markdown: 200,
      },
    },
  },
  
  {
    id: 'pdnwebview',
    name: 'pdnwebview',
    tagline: 'Web Viewer for Paint.net Project Files',
    year: '2022',
    category: 'frontend',
    status: 'active',
    projectType: 'full',
    aiUsage: 'none',
    
    description: 'A web-based viewer for Paint.net (.pdn) project files. Allows users to view and share their Paint.net projects directly in the browser without needing the desktop application.',
    purpose: 'To make Paint.net project files accessible and shareable on the web, enabling artists to showcase their work and collaborate without requiring everyone to have Paint.net installed.',
    
    technologies: ['Python', 'HTML', 'CSS', 'JavaScript', 'Flask'],
    dependencies: ['pdnexport (custom tool)', 'Pillow', 'Flask', 'Gunicorn'],
    expertise: ['Image Processing', 'Web Development', 'File Format Parsing', 'Frontend Design'],
    
    strengths: [
      'No Paint.net installation required to view files',
      'Clean, intuitive web interface',
      'Fast rendering of complex project files',
      'Cross-platform compatibility',
      'Easy sharing via URLs',
    ],
    limitations: [
      'Read-only (no editing capabilities)',
      'Requires server-side processing for conversion',
      'Limited to supported Paint.net features',
      'Large files may take time to process',
    ],
    
    installation: `# Clone the repository
git clone https://github.com/yourusername/pdnwebview.git
cd pdnwebview

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py`,
    
    usage: `1. Upload your .pdn file through the web interface
2. The server processes the file using pdnexport
3. View the rendered project in your browser
4. Share the generated URL with others

// Or use the API directly
curl -X POST -F "file=@project.pdn" https://your-server.com/api/view`,
    
    roadmap: [
      'Add layer visibility toggles',
      'Support for animation playback',
      'Implement zoom and pan controls',
      'Add export to PNG/JPEG options',
      'Create browser extension for quick viewing',
      'Support for newer Paint.net file formats',
    ],
    
    demoUrl: 'https://christian-f-brinkmann.de/pdn',
    repoUrl: undefined,
    docsUrl: undefined,
    screenshots: [],
    logo: undefined,
    
    relatedProjects: [
      { name: 'pdnexport', relation: 'Uses for file conversion' },
      { name: 'Paint.net', relation: 'File format support for', url: 'https://www.getpaint.net/' },
    ],
    
    stats: {
      stars: 28,
      commits: 89,
      branches: 2,
      lastCommit: '2023-08-20',
    },
    loc: {
      total: 4200,
      byLanguage: {
        Python: 1800,
        HTML: 800,
        JavaScript: 1200,
        CSS: 300,
        Markdown: 100,
      },
    },
  },
  
  {
    id: 'userbenchmark-scraper',
    name: 'Userbenchmark Web Scraper',
    tagline: 'Experimental Hardware Benchmark Data Extractor',
    year: '2020 - 2021',
    category: 'scraper',
    status: 'archived',
    projectType: 'full',
    aiUsage: 'none',
    
    description: 'An automated web scraper for extracting hardware benchmark data from Userbenchmark. Built with Python and featuring a custom job scheduler and Tor integration for anonymity.',
    purpose: 'To collect large-scale hardware benchmark data for analysis and research purposes, building a dataset of approximately 40,000 benchmarks.',
    
    technologies: ['Python', 'Regex', 'Tor Network', 'SQLite'],
    dependencies: ['tor-python (modified)', 'Requests', 'BeautifulSoup4', 'SQLAlchemy'],
    expertise: ['Web Scraping', 'Data Extraction', 'Anonymization', 'Job Scheduling', 'Regex Parsing'],
    
    strengths: [
      'Successfully extracted ~40,000 benchmark records',
      'Custom job scheduler for efficient processing',
      'Tor integration for request anonymization',
      'Robust error handling and retry logic',
      'Efficient regex-based parsing',
    ],
    limitations: [
      'Dependent on website structure (may break with updates)',
      'Rate limiting required to avoid blocks',
      'Tor network can be slow for large-scale scraping',
      'Ethical and legal considerations for data usage',
      'No longer actively maintained',
    ],
    
    installation: `# Install dependencies
pip install requests beautifulsoup4 sqlalchemy

# Install and configure Tor
# (Modified tor-python client included in repo)

# Initialize database
python init_db.py`,
    
    usage: `# Configure scraping parameters in config.py
TARGET_CATEGORIES = ['CPU', 'GPU', 'SSD', 'HDD', 'RAM']
BATCH_SIZE = 100
USE_TOR = True

# Run the scraper
python scraper.py

# Data is stored in SQLite database
python analyze.py --export csv`,
    
    roadmap: [
      'Project archived - no further development planned',
      'Could be adapted for other benchmark sites',
      'Potential for ML-based data analysis',
    ],
    
    demoUrl: undefined,
    repoUrl: undefined,
    screenshots: [],
    logo: undefined,
    
    relatedProjects: [
      { name: 'tor-python', relation: 'Modified version used' },
    ],
    
    stats: {
      stars: 5,
      commits: 34,
      branches: 1,
      lastCommit: '2021-06-12',
    },
    loc: {
      total: 2800,
      byLanguage: {
        Python: 2500,
        Markdown: 200,
        SQL: 100,
      },
    },
  },
  
  {
    id: 'homeserver',
    name: 'Private Homeserver',
    tagline: 'Self-Hosted Infrastructure for Personal Use',
    year: '2018 - Present',
    category: 'devops',
    status: 'active',
    projectType: 'full',
    aiUsage: 'minor',
    
    description: 'A comprehensive self-hosted server infrastructure providing web hosting, cloud storage, and AI applications for private use. Serving approximately 20 active users with 100+ TB of storage.',
    purpose: 'To create a privacy-focused, self-controlled alternative to commercial cloud services, providing reliable hosting for personal data and applications.',
    
    technologies: ['Docker', 'nginx', 'PHP', 'Bash', 'Python', 'Linux', 'openZFS', 'WireGuard'],
    dependencies: ['Docker Compose', 'nginx', 'Nextcloud', 'Jellyfin', 'Various AI models'],
    expertise: ['System Administration', 'Network Security', 'Storage Management', 'Virtualization', 'VPN Configuration', 'Backup Strategies'],
    
    strengths: [
      'Complete data privacy and control',
      'Cost-effective for multiple users',
      'Highly customizable to specific needs',
      'Robust storage with openZFS',
      'Secure remote access via VPN',
      'Reliable uptime and performance',
    ],
    limitations: [
      'Requires ongoing maintenance and updates',
      'Single point of failure (hardware)',
      'Dependent on home internet connection',
      'Security responsibility falls on administrator',
      'Initial setup complexity',
    ],
    
    installation: `# Server setup overview
# 1. Install Ubuntu Server LTS
# 2. Configure openZFS storage pools
# 3. Set up Docker and Docker Compose
# 4. Configure nginx reverse proxy
# 5. Set up WireGuard VPN
# 6. Deploy services via Docker Compose

# Example docker-compose.yml structure
version: '3.8'
services:
  nextcloud:
    image: nextcloud:latest
    # ... configuration
  jellyfin:
    image: jellyfin/jellyfin
    # ... configuration`,
    
    usage: `# Access services via VPN
wg-quick up homeserver

# Web services accessible at:
# https://cloud.yourdomain.com
# https://media.yourdomain.com

# Monitor system
htop
docker stats
zfs list`,
    
    roadmap: [
      'Implement automated backup to offsite storage',
      'Add monitoring and alerting (Prometheus/Grafana)',
      'Set up high availability for critical services',
      'Expand AI/ML service offerings',
      'Implement Infrastructure as Code (Terraform)',
      'Add Kubernetes for container orchestration',
    ],
    
    demoUrl: undefined,
    repoUrl: undefined,
    screenshots: [],
    logo: undefined,
    
    relatedProjects: [
      { name: 'Nextcloud', relation: 'Hosts', url: 'https://nextcloud.com/' },
      { name: 'Jellyfin', relation: 'Hosts', url: 'https://jellyfin.org/' },
      { name: 'openZFS', relation: 'Uses', url: 'https://openzfs.org/' },
    ],
    
    stats: {
      stars: 8,
      commits: 156,
      branches: 4,
      lastCommit: '2024-02-10',
    },
    loc: {
      total: 6500,
      byLanguage: {
        YAML: 2500,
        Bash: 2000,
        Python: 1200,
        Markdown: 600,
        Docker: 200,
      },
    },
  },

  {
    id: 'pacstall',
    name: 'Pacstall',
    tagline: 'Package Manager for Ubuntu/Debian',
    year: '2023 - Present',
    category: 'opensource',
    status: 'active',
    projectType: 'contribution',
    aiUsage: 'none',
    
    description: 'Contributing to Pacstall, an AUR-inspired package manager for Ubuntu and Debian systems. Helps bridge the gap between bleeding-edge software and stable distributions.',
    purpose: 'To make newer software versions accessible on stable Ubuntu/Debian systems without compromising system stability or waiting for official repository updates.',
    
    technologies: ['Bash', 'Linux', 'Git', 'Debian Packaging'],
    dependencies: ['Ubuntu/Debian system', 'curl', 'wget', 'build-essential'],
    expertise: ['Linux Packaging', 'Shell Scripting', 'Open Source Collaboration', 'Quality Assurance'],
    
    strengths: [
      'Access to newer software versions',
      'Community-driven package repository',
      'AUR-like simplicity for Debian systems',
      'Automatic dependency resolution',
      'Clean uninstallation support',
    ],
    limitations: [
      'Community packages may vary in quality',
      'Not officially supported by Ubuntu/Debian',
      'Potential security considerations with user packages',
      'Smaller package repository than AUR',
    ],
    
    installation: `# Install Pacstall
sudo bash -c "$(curl -fsSL https://pacstall.dev/q/install || wget -q https://pacstall.dev/q/install -O -)"

# Install a package
pacstall -I neofetch`,
    
    usage: `# Search for packages
pacstall -S package-name

# Install a package
pacstall -I package-name

# Update all pacstall packages
pacstall -Up

# Remove a package
pacstall -R package-name`,
    
    roadmap: [
      'Continue contributing new packages',
      'Improve package quality and testing',
      'Help with documentation and tutorials',
      'Contribute to core functionality improvements',
    ],
    
    demoUrl: 'https://pacstall.dev',
    repoUrl: 'https://github.com/pacstall/pacstall',
    screenshots: [],
    logo: undefined,
    
    relatedProjects: [
      { name: 'AUR', relation: 'Inspired by', url: 'https://aur.archlinux.org/' },
    ],
    
    // Contribution stats - my contributions only
    stats: {
      stars: 0, // Not my repo
      commits: 12,
      branches: 2,
      lastCommit: '2024-01-28',
    },
    loc: {
      total: 450,
      byLanguage: {
        Bash: 400,
        Markdown: 50,
      },
    },
  },
  
  {
    id: 'libretranslate-java',
    name: 'libretranslate-java',
    tagline: 'Java Client for LibreTranslate',
    year: '2023 - Present',
    category: 'opensource',
    status: 'active',
    projectType: 'full',
    aiUsage: 'minor',
    
    description: 'A Java client library for the LibreTranslate API. Provides easy integration of translation capabilities into Java applications with a clean, idiomatic API.',
    purpose: 'To provide Java developers with a simple, well-documented client for self-hosted or public LibreTranslate instances, enabling translation features without external service dependencies.',
    
    technologies: ['Java', 'HTTP Client', 'JSON', 'Maven'],
    dependencies: ['Java 11+', 'Jackson (optional)', 'Gson (optional)'],
    expertise: ['API Design', 'Java Development', 'RESTful Services', 'Library Development'],
    
    strengths: [
      'Clean, Java-idiomatic API design',
      'Support for both sync and async operations',
      'Configurable for any LibreTranslate instance',
      'Lightweight with minimal dependencies',
      'Well-documented with examples',
    ],
    limitations: [
      'Requires running LibreTranslate instance',
      'Translation quality depends on the instance',
      'Rate limits on public instances',
      'Limited to supported languages',
    ],
    
    installation: `// Maven
<dependency>
    <groupId>de.christianfbrinkmann</groupId>
    <artifactId>libretranslate-java</artifactId>
    <version>1.0.0</version>
</dependency>

// Gradle
implementation 'de.christianfbrinkmann:libretranslate-java:1.0.0'`,
    
    usage: `// Create client
LibreTranslateClient client = LibreTranslateClient.builder()
    .baseUrl("https://libretranslate.de")
    .apiKey("your-api-key") // optional
    .build();

// Translate text
TranslationResult result = client.translate()
    .text("Hello, World!")
    .source(SourceLanguage.ENGLISH)
    .target(TargetLanguage.GERMAN)
    .execute();

System.out.println(result.getTranslatedText()); // "Hallo, Welt!"`,
    
    roadmap: [
      'Add support for batch translations',
      'Implement caching for repeated translations',
      'Add Spring Boot auto-configuration',
      'Support for file/document translation',
      'Add reactive/Reactor support',
    ],
    
    demoUrl: undefined,
    repoUrl: undefined,
    docsUrl: undefined,
    screenshots: [],
    logo: undefined,
    
    relatedProjects: [
      { name: 'LibreTranslate', relation: 'Client for', url: 'https://libretranslate.com/' },
    ],
    
    stats: {
      stars: 15,
      commits: 38,
      branches: 2,
      lastCommit: '2024-01-20',
    },
    loc: {
      total: 3200,
      byLanguage: {
        Java: 2800,
        'XML': 250,
        Markdown: 150,
      },
    },
  },
  
  {
    id: 'small-projects',
    name: 'Small Projects & Scripts',
    tagline: 'Utility Tools and Helper Scripts',
    year: 'Various',
    category: 'utility',
    status: 'active',
    projectType: 'full',
    aiUsage: 'none',
    
    description: 'A collection of small but useful utility projects and scripts for various tasks including Redis data management, secure downloading, duplicate file detection, and simple file hosting.',
    purpose: 'To solve specific, recurring problems with focused, lightweight tools that are easy to understand, use, and modify.',
    
    technologies: ['Python', 'Bash', 'Redis', 'Tor'],
    dependencies: ['Varies by project'],
    expertise: ['Scripting', 'Automation', 'Data Processing', 'Security'],
    
    strengths: [
      'Focused, single-purpose tools',
      'Simple to understand and modify',
      'No unnecessary dependencies',
      'Well-documented usage',
      'Open source and free to use',
    ],
    limitations: [
      'Limited scope (by design)',
      'May require technical knowledge to use',
      'Minimal user interfaces',
      'Not actively maintained (stable tools)',
    ],
    
    installation: `# Each project has its own setup
# See individual README files in repositories

# General pattern
git clone https://github.com/yourusername/project-name.git
cd project-name
pip install -r requirements.txt  # if Python
chmod +x script.sh               # if Bash`,
    
    usage: `# redis-load-store
python redis-load-store.py --import data.json

# Mega-Tor-Downloader
python mega-tor-downloader.py <mega-url>

# find-duplicates
./find-duplicates.sh /path/to/search

# host-files-by-hash
python host-files.py --port 8080 --directory ./files`,
    
    roadmap: [
      'Add comprehensive test suites',
      'Create unified documentation',
      'Package for easier distribution',
      'Add CI/CD for automated testing',
    ],

    demoUrl: undefined,
    repoUrl: undefined,
    screenshots: [],
    logo: undefined,
    
    stats: {
      stars: 3,
      commits: 67,
      branches: 5,
      lastCommit: '2023-11-15',
    },
    loc: {
      total: 1800,
      byLanguage: {
        Python: 1200,
        Bash: 500,
        Markdown: 100,
      },
    },
  },
];

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

// Get full projects only (not contributions)
export function getFullProjects() {
  return projects.filter(p => p.projectType === 'full');
}

// Calculate aggregate stats for full projects only
export function getAggregateStats() {
  const fullProjects = getFullProjects();
  return {
    totalStars: fullProjects.reduce((sum, p) => sum + (p.stats?.stars || 0), 0),
    totalCommits: fullProjects.reduce((sum, p) => sum + (p.stats?.commits || 0), 0),
    totalLOC: fullProjects.reduce((sum, p) => sum + (p.loc?.total || 0), 0),
  };
}

// Get LOC by language across all full projects
export function getLOCAggregateByLanguage(): Record<string, number> {
  const fullProjects = getFullProjects();
  const aggregate: Record<string, number> = {};
  
  fullProjects.forEach(project => {
    if (project.loc?.byLanguage) {
      Object.entries(project.loc.byLanguage).forEach(([lang, count]) => {
        aggregate[lang] = (aggregate[lang] || 0) + count;
      });
    }
  });
  
  return aggregate;
}
