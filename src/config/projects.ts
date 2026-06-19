import type { Project } from '@/types/project';

export const projects: Project[] = [
  {
    "id": "filament-spool-holder",
    "name": "Auto-Rewinding Filament Spool Holder",
    "tagline": "Parametric Mechanical Spool Holder for 3D Printing",
    "year": "2024",
    "category": "other",
    "status": "active",
    "projectType": "3d-printing",
    "excludeFromStats": true,
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "none",
    "aiUtilization": "no-ai",
    "description": "A parametric auto-rewinding filament spool holder designed for dual-extrusion or multi-material 3D printers. It automatically rewinds the spool when filament is retracted, preventing tangles.",
    "purpose": "To solve filament tangling issues on multi-material 3D printers during retraction cycles, using a purely mechanical, printed spring mechanism.",
    "technologies": [
      "OpenSCAD",
      "Fusion 360",
      "3D Printing",
      "PETG",
      "PLA"
    ],
    "dependencies": [
      "608ZZ Bearings (x2)",
      "M3 Screws"
    ],
    "expertise": [
      "Mechanical Design",
      "Parametric Modeling",
      "Tolerance Calibration",
      "Additive Manufacturing"
    ],
    "strengths": [
      "Purely mechanical solution with no electronics needed",
      "Parametric design supporting spools from 50mm to 100mm wide",
      "Reliable integrated spring mechanism printed in PETG for elasticity",
      "Smooth operation utilizing standard 608ZZ skate bearings"
    ],
    "limitations": [
      "Requires precise printer calibration for functional gear clearance",
      "Integrated spring needs PETG or ABS (PLA is too brittle and creeps over time)"
    ],
    "installation": "# Clone the CAD repository\ngit clone https://github.com/example/auto-rewind-spool-holder.git\ncd auto-rewind-spool-holder\n\n# Open the .scad file in OpenSCAD to customize spool dimensions\nopenscad spool_holder.scad",
    "usage": "1. Customize the dimensions in OpenSCAD or use pre-sliced STLs.\n2. Print the spring in PETG (3 perimeters, 30% infill).\n3. Print the stand and shaft in PLA.\n4. Press-fit two 608ZZ bearings into the spool hubs.\n5. Assemble the shaft, spring, and stand together.\n6. Mount the spool and feed filament into your printer.",
    "roadmap": [
      "Add wall-mount adapter plate",
      "Create drybox-compatible low-profile version",
      "Design clutch mechanism to prevent over-tensioning"
    ],
    "repos": [
      {
        "name": "spool-holder-cad",
        "url": "https://github.com/example/auto-rewind-spool-holder",
        "type": "github"
      }
    ],
    "mirrors": [],
    "screenshots": [
      "/images/projects/filament-spool-holder/spool-holder-1.jpg",
      "/images/projects/filament-spool-holder/spool-holder-2.jpg"
    ]
  },
  {
    "id": "firecord",
    "name": "firecord",
    "tagline": "Experimental Redisson Alternative",
    "year": "2023",
    "category": "backend",
    "status": "experimental",
    "projectType": "software-project",
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "minor",
    "aiUtilization": "no-ai",
    "description": "A high-performance, Redis-based automatic object synchronization library for Java. Developed as a lightweight, low-latency alternative to Redisson, heavily utilizing AspectJ for reference-based tracking.",
    "purpose": "Born from the need to synchronize distributed state in sub-50ms tick environments where standard solutions introduced unacceptable network overhead and latency.",
    "technologies": [
      "Java",
      "Redis",
      "AspectJ",
      "Spring Framework"
    ],
    "dependencies": [
      "Redis 6.0+",
      "AspectJ Weaver",
      "Jedis or Lettuce client"
    ],
    "expertise": [
      "Distributed Systems Architecture",
      "Aspect-Oriented Programming (AspectJ)",
      "Low-Latency Memory Synchronization"
    ],
    "strengths": [
      "Eliminated manual synchronization boilerplate through AspectJ instrumentation",
      "Significantly reduced network payload sizes via intelligent, reference-based state diffing",
      "Optimized specifically for latency-critical distributed environments"
    ],
    "limitations": [
      "Experimental status - API may change",
      "Limited to Redis backend (no other data stores)",
      "AspectJ instrumentation required",
      "Smaller community than established alternatives"
    ],
    "installation": "// Add to your pom.xml\n<dependency>\n    <groupId>de.christianfbrinkmann</groupId>\n    <artifactId>firecord</artifactId>\n    <version>0.1.0-SNAPSHOT</version>\n</dependency>\n\n// Configure Redis connection\nfirecord:\n  redis:\n    host: localhost\n    port: 6379",
    "usage": "// Annotate your shared objects\n@Synchronized\npublic class SharedState {\n    private String data;\n    private int counter;\n    \n    // Getters and setters automatically synchronized\n}\n\n// Use in your application\nSharedState state = firecord.get(SharedState.class, \"state-id\");\nstate.setData(\"Hello, distributed world!\");\n// Changes automatically propagated to all nodes",
    "roadmap": [
      "Add support for Redis Cluster and Sentinel",
      "Implement configurable consistency levels",
      "Create comprehensive benchmark suite",
      "Add Spring Boot starter for easier configuration",
      "Support for custom serialization strategies",
      "Add monitoring and metrics integration"
    ],
    "repos": [],
    "mirrors": [],
    "screenshots": [],
    "relatedProjects": [
      {
        "name": "Redisson",
        "relation": "Inspiration and alternative to",
        "url": "https://redisson.org/"
      },
      {
        "name": "Redis",
        "relation": "Built on top of",
        "url": "https://redis.io/"
      }
    ]
  },
  {
    "id": "homeserver",
    "name": "Private Homeserver",
    "tagline": "Self-Hosted Infrastructure for Personal Use",
    "year": "2018 - Present",
    "category": "devops-infrastructure",
    "status": "active",
    "projectType": "it-project",
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "minor",
    "aiUtilization": "no-ai",
    "description": "A production-grade, self-hosted infrastructure environment operating continuously since 2018. Manages over 100+ TB of storage serving approximately 20 active users with zero major data loss incidents.",
    "purpose": "To create a privacy-focused, self-controlled alternative to commercial cloud services, providing reliable hosting for personal data and applications.",
    "technologies": [
      "Docker",
      "nginx",
      "PHP",
      "Bash",
      "Python",
      "Linux",
      "openZFS",
      "WireGuard"
    ],
    "dependencies": [
      "Docker Compose",
      "nginx",
      "Nextcloud",
      "Jellyfin",
      "Various AI models"
    ],
    "expertise": [
      "Site Reliability Engineering (SRE)",
      "openZFS Storage Architecture",
      "Docker Orchestration",
      "Network Security & VPNs"
    ],
    "strengths": [
      "8 years of continuous uptime and infrastructure maintenance",
      "Architected robust storage pools using openZFS for enterprise-grade data integrity",
      "Automated deployment of web, cloud, and AI applications via Docker Compose and nginx",
      "Secure network routing and remote access configured via WireGuard"
    ],
    "limitations": [
      "Requires ongoing maintenance and updates",
      "Single point of failure (hardware)",
      "Dependent on home internet connection",
      "Security responsibility falls on administrator",
      "Initial setup complexity"
    ],
    "installation": "# Server setup overview\n# 1. Install Ubuntu Server LTS\n# 2. Configure openZFS storage pools\n# 3. Set up Docker and Docker Compose\n# 4. Configure nginx reverse proxy\n# 5. Set up WireGuard VPN\n# 6. Deploy services via Docker Compose\n\n# Example docker-compose.yml structure\nversion: '3.8'\nservices:\n  nextcloud:\n    image: nextcloud:latest\n    # ... configuration\n  jellyfin:\n    image: jellyfin/jellyfin\n    # ... configuration",
    "usage": "# Access services via VPN\nwg-quick up homeserver\n\n# Web services accessible at:\n# https://cloud.yourdomain.com\n# https://media.yourdomain.com\n\n# Monitor system\nhtop\ndocker stats\nzfs list",
    "roadmap": [
      "Implement automated backup to offsite storage",
      "Add monitoring and alerting (Prometheus/Grafana)",
      "Set up high availability for critical services",
      "Expand AI/ML service offerings",
      "Implement Infrastructure as Code (Terraform)",
      "Add Kubernetes for container orchestration"
    ],
    "repos": [],
    "mirrors": [],
    "screenshots": [],
    "relatedProjects": [
      {
        "name": "Nextcloud",
        "relation": "Hosts",
        "url": "https://nextcloud.com/"
      },
      {
        "name": "Jellyfin",
        "relation": "Hosts",
        "url": "https://jellyfin.org/"
      },
      {
        "name": "openZFS",
        "relation": "Uses",
        "url": "https://openzfs.org/"
      }
    ]
  },
  {
    "id": "libretranslate-java",
    "name": "libretranslate-java",
    "tagline": "Java Client for LibreTranslate",
    "year": "2023 - Present",
    "category": "library",
    "status": "active",
    "projectType": "software-project",
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "minor",
    "aiUtilization": "no-ai",
    "description": "A Java client library for the LibreTranslate API. Provides easy integration of translation capabilities into Java applications with a clean, idiomatic API.",
    "purpose": "To provide Java developers with a simple, well-documented client for self-hosted or public LibreTranslate instances, enabling translation features without external service dependencies.",
    "technologies": [
      "Java",
      "HTTP Client",
      "JSON",
      "Maven"
    ],
    "dependencies": [
      "Java 11+",
      "Jackson (optional)",
      "Gson (optional)"
    ],
    "expertise": [
      "API Design",
      "Java Development",
      "RESTful Services",
      "Library Development"
    ],
    "strengths": [
      "Clean, Java-idiomatic API design",
      "Support for both sync and async operations",
      "Configurable for any LibreTranslate instance",
      "Lightweight with minimal dependencies",
      "Well-documented with examples"
    ],
    "limitations": [
      "Requires running LibreTranslate instance",
      "Translation quality depends on the instance",
      "Rate limits on public instances",
      "Limited to supported languages"
    ],
    "installation": "// Maven\n<dependency>\n    <groupId>de.christianfbrinkmann</groupId>\n    <artifactId>libretranslate-java</artifactId>\n    <version>1.0.0</version>\n</dependency>\n\n// Gradle\nimplementation 'de.christianfbrinkmann:libretranslate-java:1.0.0'",
    "usage": "// Create client\nLibreTranslateClient client = LibreTranslateClient.builder()\n    .baseUrl(\"https://libretranslate.de\")\n    .apiKey(\"your-api-key\") // optional\n    .build();\n\n// Translate text\nTranslationResult result = client.translate()\n    .text(\"Hello, World!\")\n    .source(SourceLanguage.ENGLISH)\n    .target(TargetLanguage.GERMAN)\n    .execute();\n\nSystem.out.println(result.getTranslatedText()); // \"Hallo, Welt!\"",
    "roadmap": [
      "Add support for batch translations",
      "Implement caching for repeated translations",
      "Add Spring Boot auto-configuration",
      "Support for file/document translation",
      "Add reactive/Reactor support"
    ],
    "repos": [],
    "mirrors": [],
    "screenshots": [],
    "relatedProjects": [
      {
        "name": "LibreTranslate",
        "relation": "Client for",
        "url": "https://libretranslate.com/"
      }
    ]
  },
  {
    "id": "pacstall",
    "name": "Pacstall",
    "tagline": "Package Manager for Ubuntu/Debian",
    "year": "2023 - Present",
    "category": "package-management",
    "status": "active",
    "projectType": "software-project",
    "role": "contributor",
    "sourceType": "open-source",
    "aiUsage": "none",
    "aiUtilization": "no-ai",
    "description": "Contributing to Pacstall, an AUR-inspired package manager for Ubuntu and Debian systems. Helps bridge the gap between bleeding-edge software and stable distributions.",
    "purpose": "To make newer software versions accessible on stable Ubuntu/Debian systems without compromising system stability or waiting for official repository updates.",
    "technologies": [
      "Bash",
      "Linux",
      "Git",
      "Debian Packaging"
    ],
    "dependencies": [
      "Ubuntu/Debian system",
      "curl",
      "wget",
      "build-essential"
    ],
    "expertise": [
      "Linux Packaging",
      "Shell Scripting",
      "Open Source Collaboration",
      "Quality Assurance"
    ],
    "strengths": [
      "Access to newer software versions",
      "Community-driven package repository",
      "AUR-like simplicity for Debian systems",
      "Automatic dependency resolution",
      "Clean uninstallation support"
    ],
    "limitations": [
      "Community packages may vary in quality",
      "Not officially supported by Ubuntu/Debian",
      "Potential security considerations with user packages",
      "Smaller package repository than AUR"
    ],
    "installation": "# Install Pacstall\nsudo bash -c \"$(curl -fsSL https://pacstall.dev/q/install || wget -q https://pacstall.dev/q/install -O -)\"\n\n# Install a package\npacstall -I neofetch",
    "usage": "# Search for packages\npacstall -S package-name\n\n# Install a package\npacstall -I package-name\n\n# Update all pacstall packages\npacstall -Up\n\n# Remove a package\npacstall -R package-name",
    "roadmap": [
      "Continue contributing new packages",
      "Improve package quality and testing",
      "Help with documentation and tutorials",
      "Contribute to core functionality improvements"
    ],
    "demoUrl": "https://pacstall.dev",
    "repos": [
      {
        "name": "pacstall",
        "url": "https://github.com/pacstall/pacstall",
        "type": "github"
      }
    ],
    "mirrors": [],
    "screenshots": [],
    "relatedProjects": [
      {
        "name": "AUR",
        "relation": "Inspired by",
        "url": "https://aur.archlinux.org/"
      }
    ]
  },
  {
    "id": "pdnwebview",
    "name": "pdnwebview",
    "tagline": "Web Viewer for Paint.net Project Files",
    "year": "2022",
    "category": "frontend",
    "status": "active",
    "projectType": "software-project",
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "none",
    "aiUtilization": "no-ai",
    "description": "A web-based viewer for Paint.net (.pdn) project files. Allows users to view and share their Paint.net projects directly in the browser without needing the desktop application.",
    "purpose": "To make Paint.net project files accessible and shareable on the web, enabling artists to showcase their work and collaborate without requiring everyone to have Paint.net installed.",
    "technologies": [
      "Python",
      "HTML",
      "CSS",
      "JavaScript",
      "Flask"
    ],
    "dependencies": [
      "pdnexport (custom tool)",
      "Pillow",
      "Flask",
      "Gunicorn"
    ],
    "expertise": [
      "Image Processing",
      "Web Development",
      "File Format Parsing",
      "Frontend Design"
    ],
    "strengths": [
      "No Paint.net installation required to view files",
      "Clean, intuitive web interface",
      "Fast rendering of complex project files",
      "Cross-platform compatibility",
      "Easy sharing via URLs"
    ],
    "limitations": [
      "Read-only (no editing capabilities)",
      "Requires server-side processing for conversion",
      "Limited to supported Paint.net features",
      "Large files may take time to process"
    ],
    "installation": "# Clone the repository\ngit clone https://github.com/yourusername/pdnwebview.git\ncd pdnwebview\n\n# Install dependencies\npip install -r requirements.txt\n\n# Run the application\npython app.py",
    "usage": "1. Upload your .pdn file through the web interface\n2. The server processes the file using pdnexport\n3. View the rendered project in your browser\n4. Share the generated URL with others\n\n// Or use the API directly\ncurl -X POST -F \"file=@project.pdn\" https://your-server.com/api/view",
    "roadmap": [
      "Add layer visibility toggles",
      "Support for animation playback",
      "Implement zoom and pan controls",
      "Add export to PNG/JPEG options",
      "Create browser extension for quick viewing",
      "Support for newer Paint.net file formats"
    ],
    "demoUrl": "https://christian-f-brinkmann.de/pdn",
    "repos": [],
    "mirrors": [],
    "screenshots": [],
    "relatedProjects": [
      {
        "name": "pdnexport",
        "relation": "Uses for file conversion"
      },
      {
        "name": "Paint.net",
        "relation": "File format support for",
        "url": "https://www.getpaint.net/"
      }
    ]
  },
  {
    "id": "small-projects",
    "name": "Small Projects & Scripts",
    "tagline": "Utility Tools and Helper Scripts",
    "year": "Various",
    "category": "utility",
    "status": "active",
    "projectType": "script-small",
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "none",
    "aiUtilization": "no-ai",
    "description": "A collection of small but useful utility projects and scripts for various tasks including Redis data management, secure downloading, duplicate file detection, and simple file hosting.",
    "purpose": "To solve specific, recurring problems with focused, lightweight tools that are easy to understand, use, and modify.",
    "technologies": [
      "Python",
      "Bash",
      "Redis",
      "Tor"
    ],
    "dependencies": [
      "Varies by project"
    ],
    "expertise": [
      "Scripting",
      "Automation",
      "Data Processing",
      "Security"
    ],
    "strengths": [
      "Focused, single-purpose tools",
      "Simple to understand and modify",
      "No unnecessary dependencies",
      "Well-documented usage",
      "Open source and free to use"
    ],
    "limitations": [
      "Limited scope (by design)",
      "May require technical knowledge to use",
      "Minimal user interfaces",
      "Not actively maintained (stable tools)"
    ],
    "installation": "# Each project has its own setup\n# See individual README files in repositories\n\n# General pattern\ngit clone https://github.com/yourusername/project-name.git\ncd project-name\npip install -r requirements.txt  # if Python\nchmod +x script.sh               # if Bash",
    "usage": "# redis-load-store\npython redis-load-store.py --import data.json\n\n# Mega-Tor-Downloader\npython mega-tor-downloader.py <mega-url>\n\n# find-duplicates\n./find-duplicates.sh /path/to/search\n\n# host-files-by-hash\npython host-files.py --port 8080 --directory ./files",
    "roadmap": [
      "Add comprehensive test suites",
      "Create unified documentation",
      "Package for easier distribution",
      "Add CI/CD for automated testing"
    ],
    "repos": [],
    "mirrors": [],
    "screenshots": []
  },
  {
    "id": "userbenchmark-scraper",
    "name": "Userbenchmark Web Scraper",
    "tagline": "Experimental Hardware Benchmark Data Extractor",
    "year": "2020 - 2021",
    "category": "data-scraping",
    "status": "archived",
    "projectType": "script-small",
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "none",
    "aiUtilization": "no-ai",
    "description": "An end-to-end data extraction pipeline built in Python. Features a custom job scheduler and Tor network routing to bypass aggressive rate limiting, successfully aggregating a massive hardware dataset.",
    "purpose": "To collect large-scale hardware benchmark data for analysis and research purposes, building a dataset of approximately 40,000 benchmarks.",
    "technologies": [
      "Python",
      "Regex",
      "Tor Network",
      "SQLite"
    ],
    "dependencies": [
      "tor-python (modified)",
      "Requests",
      "BeautifulSoup4",
      "SQLAlchemy"
    ],
    "expertise": [
      "Data Pipeline Engineering",
      "Custom Job Scheduling",
      "Network Routing (Tor)",
      "Regex Parsing"
    ],
    "strengths": [
      "Successfully parsed and extracted ~40,000 distinct benchmark records",
      "Engineered a custom job scheduler to manage asynchronous scraping tasks and error recovery",
      "Implemented resilient request routing using a modified tor-python client to handle IP blocks",
      "Highly optimized Regex parsing for unstructured HTML data"
    ],
    "limitations": [
      "Dependent on website structure (may break with updates)",
      "Rate limiting required to avoid blocks",
      "Tor network can be slow for large-scale scraping",
      "Ethical and legal considerations for data usage",
      "No longer actively maintained"
    ],
    "installation": "# Install dependencies\npip install requests beautifulsoup4 sqlalchemy\n\n# Install and configure Tor\n# (Modified tor-python client included in repo)\n\n# Initialize database\npython init_db.py",
    "usage": "# Configure scraping parameters in config.py\nTARGET_CATEGORIES = ['CPU', 'GPU', 'SSD', 'HDD', 'RAM']\nBATCH_SIZE = 100\nUSE_TOR = True\n\n# Run the scraper\npython scraper.py\n\n# Data is stored in SQLite database\npython analyze.py --export csv",
    "roadmap": [
      "Project archived - no further development planned",
      "Could be adapted for other benchmark sites",
      "Potential for ML-based data analysis"
    ],
    "repos": [],
    "mirrors": [],
    "screenshots": [],
    "relatedProjects": [
      {
        "name": "tor-python",
        "relation": "Modified version used"
      }
    ]
  }
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

// Get projects by role
export function getProjectsByRole(role: string) {
  return projects.filter(p => p.role === role);
}

// Get main author projects only
export function getMainAuthorProjects() {
  return projects.filter(p => p.role === 'main-author');
}

// Calculate aggregate stats for main author projects only
export function getAggregateStats() {
  const ownProjects = getMainAuthorProjects();
  return {
    totalStars: ownProjects.reduce((sum, p) => sum + (p.stats?.stars || 0), 0),
    totalCommits: ownProjects.reduce((sum, p) => sum + (p.stats?.commits || 0), 0),
    totalLOC: ownProjects.reduce((sum, p) => sum + (p.loc?.total || 0), 0),
  };
}

// Get LOC by language across all main author projects
export function getLOCAggregateByLanguage(): Record<string, number> {
  const ownProjects = getMainAuthorProjects();
  const aggregate: Record<string, number> = {};
  
  ownProjects.forEach(project => {
    if (project.loc?.byLanguage) {
      Object.entries(project.loc.byLanguage).forEach(([lang, count]) => {
        aggregate[lang] = (aggregate[lang] || 0) + count;
      });
    }
  });
  
  return aggregate;
}
