import type { Project } from '@/types/project';

export const projects: Project[] = [
  {
    "id": "advoexport",
    "name": "advoexport",
    "tagline": "Custom ETL Pipeline for Legacy Legal Data Migration",
    "year": "2020",
    "category": "utility",
    "status": "completed",
    "projectType": "it-project",
    "role": "main-author",
    "sourceType": "closed-source",
    "aiUsage": "none",
    "aiUtilization": "no-ai",
    "description": "A Python-based ETL pipeline designed to extract, transform, and migrate legacy case files from the Advoware legal management system into a clean, file-system-based NAS architecture.",
    "purpose": "To automate the extraction of unstructured, poorly mapped document repositories by cross-referencing them with exported database process registers (.xls), bypassing the need for expensive proprietary migration tools.",
    "technologies": [
      "Python",
      "Excel Data Parsing",
      "Linux",
      "Bash"
    ],
    "dependencies": [
      "xlrd",
      "shutil"
    ],
    "expertise": [
      "ETL Pipelines",
      "Data Transformation",
      "Data Sanitization",
      "Reverse Engineering"
    ],
    "strengths": [
      "Successfully mapped and migrated thousands of legal documents with zero data loss",
      "Handles complex string cleaning, space-escaped directory paths, and legacy encoding issues",
      "Maintains data integrity and structure across deep, nested file systems",
      "Lightweight and framework-free implementation optimized for localized execution"
    ],
    "limitations": [],
    "roadmap": [],
    "repos": [
      {
        "name": "advoexport",
        "url": "https://gitlab.com/christianbrinkmann/advoexport",
        "type": "gitlab"
      }
    ],
    "mirrors": [],
    "screenshots": []
  },
  {
    "id": "cpp-ml-interface",
    "name": "CPP-ML-Interface",
    "tagline": "Hardware-Accelerated AI Inference Middleware",
    "year": "2025 - 2026",
    "category": "backend",
    "status": "active",
    "projectType": "software-project",
    "academic": true,
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "contributed",
    "aiUtilization": "ai-powered",
    "description": "A modular C++ middleware designed to couple complex Computational Fluid Dynamics (CFD) solvers with machine learning inference models. Developed on a Rocky 9 HPC cluster, it abstracts underlying hardware and coupling libraries.",
    "purpose": "To eliminate interconnect bottlenecks in High-Performance Computing (HPC) by providing a platform-independent data path between physical simulations and AI models.",
    "technologies": [
      "C++",
      "Slurm",
      "Rocky Linux (RHEL)",
      "Python"
    ],
    "dependencies": [
      "SmartSim",
      "PhyDLL",
      "AixeleratorService",
      "MPI"
    ],
    "expertise": [
      "HPC Architecture",
      "Low-Latency Memory Management",
      "Systems Integration",
      "C++ Middleware Design"
    ],
    "strengths": [
      "Abstracts heterogeneous coupling libraries (SmartSim, PhyDLL) into a unified configuration-based interface",
      "Optimized for High-Performance Computing (HPC) environments running Rocky 9",
      "Handles complex memory-to-memory data transfers between CPU nodes and GPU inference endpoints",
      "Critical evaluation of Redis-based coupling limitations in soft real-time constraints"
    ],
    "limitations": [
      "Performance bound by coupling library interconnects under heavy GPU load",
      "Requires Rocky Linux 9 or RHEL-compatible HPC cluster configuration"
    ],
    "roadmap": [
      "Implement direct zero-copy memory transfers via GPU-Direct RDMA",
      "Add support for PyTorch and TensorFlow C++ native API endpoints",
      "Extend documentation and coupling benchmarker tools"
    ],
    "repos": [],
    "mirrors": [],
    "screenshots": []
  },
  {
    "id": "custom-orchestration",
    "name": "Distributed Linux Service Orchestrator",
    "tagline": "Bespoke Control Plane and CI/CD Engine for Low-Latency Application Clusters",
    "year": "2023 - Present",
    "category": "devops-infrastructure",
    "status": "active",
    "projectType": "it-project",
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "contributed",
    "aiUtilization": "no-ai",
    "description": "A lightweight, low-overhead orchestration platform and automated CI/CD control plane written in Bash. Designed to manage a distributed multi-instance cluster with strict memory isolation, soft real-time execution constraints, and zero-downtime hot-reloads.",
    "purpose": "To deliver deterministic daemon lifecycle management and deployment automation in high-concurrency environments where standard containerization runtimes introduce unacceptable process jitter and latency overhead.",
    "technologies": [
      "Bash",
      "Linux",
      "Redis",
      "Maven",
      "Git"
    ],
    "dependencies": [
      "screen",
      "jq",
      "curl",
      "lsof",
      "procps"
    ],
    "expertise": [
      "Process Lifecycle & Signal Handling",
      "Parallel Automation (Concurrency)",
      "Storage Isolation & Loop Devices",
      "Log Analytics & Unix Text Processing Pipeline",
      "Automated Privilege Escalation"
    ],
    "strengths": [
      "Implemented a cascading process termination matrix (Graceful Command -> Emulated Key Injection -> Window Termination -> OS-Level SIGKILL via Process Tree Tracing)",
      "Engineered asynchronous parallel task execution using background subshells and dynamic PID tracking arrays for concurrent Git operations",
      "Designed automated storage virtualization and isolation by generating 10GB raw images, formatting ext4 filesystems, and loop-mounting to prevent host disk exhaustion",
      "Built a real-time watchdog system monitoring log capacities, process utilization, and dynamic ports with automated Discord webhook notifications via structured JSON payloads",
      "Advanced utilization of Bash 4+ associative arrays to map multi-layered application states, dependencies, and dynamic routing profiles",
      "Created text-processing pipelines using sed, awk, and grep for custom dynamic string multiplexing and multi-criteria server/plugin selection logic"
    ],
    "limitations": [
      "Tightly coupled with GNU Screen as the terminal multiplexer backend",
      "Configuration management relies on sourced flat-file state scripts rather than declarative syntax (YAML/JSON)",
      "Platform-dependent orchestration optimized primarily for Debian-based systems"
    ],
    "roadmap": [
      "Abstract the terminal multiplexer layer to support systemd slices or lightweight cgroups directly",
      "Migrate the procedural bash architecture toward a compiled, typed platform utility (Go/Rust)",
      "Integrate Prometheus exposition endpoints for structured telemetry collection"
    ],
    "repos": [],
    "mirrors": [],
    "screenshots": []
  },
  {
    "id": "exam-system-backend",
    "name": "LLM-Integrated Exam System",
    "tagline": "Scaled Backend for University Assessments",
    "year": "2025",
    "category": "backend",
    "status": "completed",
    "projectType": "software-project",
    "academic": true,
    "role": "backend-co-lead",
    "sourceType": "closed-source",
    "aiUsage": "minor",
    "aiUtilization": "ai-enhanced",
    "description": "Extended an existing digital examination system for a Ukrainian university. Engineered the backend architecture, database schema, and microservice orchestration to handle concurrent student loads.",
    "purpose": "To introduce knowledge-based testing to the examination infrastructure and introduce automated, AI-assisted preliminary grading for free-text answers to reduce examiner workload.",
    "technologies": [
      "Kubernetes",
      "SQL",
      "JavaScript",
      "openai API"
    ],
    "dependencies": [],
    "expertise": [
      "Microservice Orchestration",
      "Database Design",
      "API Integration",
      "Containerization"
    ],
    "strengths": [
      "Successfully containerized and deployed the application stack using Kubernetes",
      "Designed scalable SQL schemas to handle concurrent exam submissions securely",
      "Integrated LLM endpoints for automated, preliminary evaluation of free-text responses",
      "Delivered a robust backend under tight academic project deadlines"
    ],
    "limitations": [],
    "roadmap": [],
    "repos": [],
    "mirrors": [],
    "screenshots": []
  },
  {
    "id": "ferienw-am-meer-modernization",
    "name": "ferienw-am-meer.de",
    "tagline": "Static Site Modernization & High-Performance Web Engineering",
    "year": "2026",
    "category": "frontend",
    "status": "active",
    "projectType": "software-project",
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "full",
    "aiUtilization": "no-ai",
    "description": "Migrated and completely re-architected a legacy static HTML website into a high-performance, modern web application. Focused on extreme frontend asset optimization, strict type safety, and automated CI/CD deployment pipelines.",
    "purpose": "To transform an outdated web presence into a blazing-fast, mobile-first experience while establishing an automated infrastructure for media processing and zero-downtime hosting.",
    "technologies": [
      "Next.js",
      "Tailwind CSS v4",
      "TypeScript",
      "GitHub Actions",
      "Node.js"
    ],
    "dependencies": [
      "postcss",
      "tsconfig",
      "sharp"
    ],
    "expertise": [
      "Web Performance Optimization (FCP/LCP)",
      "Automated Media Pipelines",
      "CI/CD Deployment Automation",
      "Responsive Frontend Architecture"
    ],
    "strengths": [
      "Engineered a complete architectural overhaul by transitioning legacy HTML into a type-safe Next.js implementation utilizing Tailwind CSS v4",
      "Optimized critical Core Web Vitals (FCP/LCP) by leveraging experimental native CSS inlining configurations inside the Next.js runtime",
      "Built a custom automated image processing pipeline converting graphic assets to highly compressed WebP formats for faster loading times",
      "Implemented automated Low-Quality Image Placeholders (LQIP) via blur placeholders to eliminate visual layout shifts (CLS) during image hydration",
      "Designed a robust hash-based gallery metadata system to synchronize media states dynamically and ensure correct asset descriptions",
      "Architected an automated CI/CD deployment workflow via GitHub Actions with complex basePath mapping logic tailored for custom domains"
    ],
    "limitations": [
      "Primarily static presentation architecture, limits dynamic server-side runtime operations",
      "Gallery updates depend on local script-based metadata generation before deployment"
    ],
    "roadmap": [
      "Integrate a headless CMS layer to decouple content creation from the codebase",
      "Implement automated end-to-end testing profiles using Playwright or Cypress"
    ],
    "liveUrl": "https://ferienw-am-meer.de",
    "oldUrl": "https://ferien.christian-f-brinkmann.de",
    "repos": [
      {
        "name": "ferienw-am-meer.de",
        "url": "https://github.com/chrisb09/github-page.ferienw-am-meer.de",
        "type": "github"
      }
    ],
    "mirrors": [],
    "screenshots": []
  },
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
    "year": "2023 - Present",
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
    "year": "2024",
    "category": "library",
    "status": "active",
    "projectType": "software-project",
    "role": "contributor",
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
    "id": "pacstall-programs",
    "name": "Pacstall Programs",
    "tagline": "Package Manager for Ubuntu/Debian",
    "year": "2025 - Present",
    "category": "package-management",
    "status": "active",
    "projectType": "software-project",
    "role": "contributor",
    "sourceType": "open-source",
    "aiUsage": "none",
    "aiUtilization": "no-ai",
    "description": "Contributing to the Pacstall package repository, an AUR-inspired package manager for Ubuntu and Debian systems. Helps bridge the gap between bleeding-edge software and stable distributions.",
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
    "liveUrl": "https://pacstall.dev",
    "repos": [
      {
        "name": "pacstall-programs",
        "url": "https://github.com/pacstall/pacstall-programs",
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
    "description": "A custom web-based viewer for Paint.net (.pdn) project files. Built entirely without heavy frontend frameworks to ensure maximum rendering performance and a lightweight footprint.",
    "purpose": "To make Paint.net project files accessible and shareable on the web, enabling artists to showcase their work and collaborate without requiring everyone to have Paint.net installed.",
    "technologies": [
      "JavaScript",
      "HTML",
      "CSS",
      "Python"
    ],
    "dependencies": [
      "pdnexport (custom tool)",
      "pypdn (Paint.net format parser library)",
      "Pillow"
    ],
    "expertise": [
      "Image Processing",
      "Web Development",
      "File Format Parsing",
      "Frontend Design"
    ],
    "strengths": [
      "Highly optimized vanilla implementation avoiding bloated JavaScript frameworks",
      "Custom backend conversion pipeline (pdnexport) for rapid file processing",
      "Clean, fast rendering of complex, multi-layered image projects in the browser"
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
    "repos": [
      {
        "name": "pdnwebview",
        "url": "https://github.com/chrisb09/pdnwebview",
        "type": "github"
      },
      {
        "name": "pdnexport",
        "url": "https://gitlab.com/christianbrinkmann/pdnexport",
        "type": "gitlab"
      }
    ],
    "mirrors": [],
    "screenshots": [
      "/images/projects/pdnwebview/zaubertrank.png"
    ],
    "relatedProjects": [
      {
        "name": "pdnexport",
        "relation": "Uses for file conversion"
      },
      {
        "name": "pypdn",
        "relation": "Dependency of pdnexport for Paint.net binary parsing",
        "url": "https://github.com/addisonElliott/pypdn/"
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
    "tagline": "Distributed Client-Server Web Scraper using Tor exit node routing",
    "year": "2020 - 2021",
    "category": "data-scraping",
    "status": "archived",
    "projectType": "script-small",
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "none",
    "aiUtilization": "no-ai",
    "description": "A distributed client-server web scraping system written in Python. It features a centralized coordinator (TCP socket server) that manages a job queue and coordinates multiple regional Docker-based scraping clients. Clients route requests through regional Tor exit nodes to bypass rate limiting, parsing unstructured HTML benchmarks and returning structured JSON data back to the server, which aggregates it into a centralized SQLite database.",
    "purpose": "To collect large-scale, multi-category hardware benchmark statistics across CPUs, GPUs, SSDs, HDDs, and RAM by distributing traffic across multiple Tor exit nodes and regional IP addresses to prevent rate-limit blocks.",
    "technologies": [
      "Python",
      "TCP Socket Programming",
      "Tor Network",
      "Docker",
      "SQLite",
      "Multi-threading"
    ],
    "dependencies": [
      "requests",
      "PySocks",
      "Tor",
      "Docker & Docker Compose",
      "torpyjob (custom-built job coordinator client)",
      "torpy (modified Tor connection client library)"
    ],
    "expertise": [
      "Distributed Systems",
      "Socket Programming",
      "Network Routing & Tor",
      "Regex Parsing & HTML Scraping",
      "Multi-threaded Data Pipelines"
    ],
    "strengths": [
      "Distributed client-server architecture coordinating multiple concurrent scraping workers",
      "Tor network exit node manipulation to rotate IP addresses by country code",
      "Lightweight TCP socket-based communication protocol for job distribution",
      "Lightweight raw SQLite database integration with thread-safe transactional queueing",
      "Containerized client deployment using Docker for simple scale-out"
    ],
    "limitations": [
      "Dependent on Userbenchmark HTML structure (breaks on layout changes)",
      "Scraping throughput is limited by Tor relay network speed",
      "Requires stable server port forwarding/reachability for TCP socket connections",
      "No longer actively maintained"
    ],
    "installation": "# Server Setup\npython server_main.py\n\n# Client Setup (requires Tor)\npython client_main.py --host=<server-ip>\n\n# Or build and run via Docker\ndocker build -t scraper-client -f docker/Dockerfile.client .\n",
    "usage": "# Run the TCP server to coordinate jobs\npython server_main.py\n\n# Spin up Tor-routed client workers\npython client_main.py --host=127.0.0.1",
    "roadmap": [
      "Project archived - no further development planned"
    ],
    "repos": [
      {
        "name": "userbenchmark-web-scraper",
        "url": "https://gitlab.com/christianbrinkmann/userbenchmark-web-scraper",
        "type": "gitlab"
      },
      {
        "name": "torpyjob",
        "url": "https://github.com/chrisb09/torpyjob",
        "type": "github"
      },
      {
        "name": "torpy",
        "url": "https://gitlab.com/christianbrinkmann/torpy",
        "type": "gitlab"
      }
    ],
    "mirrors": [],
    "screenshots": [],
    "relatedProjects": [
      {
        "name": "tor-python",
        "relation": "Modified version used"
      },
      {
        "name": "torpyjob",
        "relation": "Custom client utility for scraper coordination",
        "url": "https://github.com/chrisb09/torpyjob"
      },
      {
        "name": "torpy",
        "relation": "Modified Tor networking library utilized by scraper",
        "url": "https://gitlab.com/christianbrinkmann/torpy"
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
