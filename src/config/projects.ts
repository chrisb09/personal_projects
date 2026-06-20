import type { Project } from '@/types/project';

export const projects: Project[] = [
  {
    "id": "MusicBot",
    "name": "JMusicBot Fork",
    "tagline": "Feature-rich self-hosted Discord music bot fork with playback analytics and Docker deployment",
    "year": "2024-Present",
    "category": "backend",
    "status": "active",
    "projectType": "software-project",
    "role": "fork-maintainer",
    "sourceType": "open-source",
    "aiUsage": "contributed",
    "aiUtilization": "no-ai",
    "description": "A maintained, feature-rich fork of the popular self-hosted JMusicBot Discord music bot. Built with JDA 6 and Java, it includes modern Discord voice encryption (DAVE) support, optional YouTube account login (OAuth2), custom per-channel playback status messages, and JDBC/SQLite playback analytics logging. The project includes a dedicated Docker container deployment path.",
    "purpose": "To keep JMusicBot operational on modern Discord API standards while expanding it with database-backed statistics and native container support.",
    "technologies": [
      "Java",
      "Docker",
      "SQLite",
      "JDA"
    ],
    "dependencies": [
      "JDA 6.x",
      "lavaplayer",
      "SQLite-JDBC",
      "JDA-Chewtils"
    ],
    "expertise": [
      "Backend Development",
      "API Integration",
      "Containerization",
      "Database Logging"
    ],
    "strengths": [
      "Fully updated to support DAVE voice encryption and JDA 6.1.1",
      "Bypasses YouTube rate limits via Google account OAuth2 login & visitor tokens",
      "Built-in SQLite playback analytics and scheduling scheduler reports",
      "Comes with containerized Docker deployment and compose configurations"
    ],
    "limitations": [
      "Subject to ongoing changes in YouTube and Discord API structures",
      "Requires manual Google account login config for restricted content",
      "Requires Docker or Java 8+ environment to self-host"
    ],
    "installation": "# Clone and build the jar:\ngit clone git@github.com:chrisb09/MusicBot.git\ncd MusicBot\nmvn clean package\n\n# Or run via Docker Compose:\ndocker-compose up -d",
    "usage": "# Run JMusicBot directly:\njava -Dnogui=true -jar JMusicBot.jar\n\n# Configure settings in config.txt:\ntoken=YOUR_BOT_TOKEN\nowner=YOUR_DISCORD_ID\nyoutubeoauth2=true",
    "roadmap": [
      "Automate dependencies/lavaplayer library version bumps",
      "Support database-backed web dashboard for real-time playlist sharing"
    ],
    "repos": [
      {
        "name": "MusicBot",
        "url": "https://github.com/chrisb09/MusicBot",
        "type": "github"
      },
      {
        "name": "jmb-container",
        "url": "https://github.com/chrisb09/jmb-container",
        "type": "github"
      }
    ],
    "mirrors": [],
    "screenshots": [],
    "demoUrl": "https://discord.gg/4cp9CvjwaW",
    "logo": "/images/projects/MusicBot/logo.png"
  },
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
    "id": "cycling-power-estimator",
    "name": "Cycling Power Estimator & 3D Visualizer",
    "tagline": "Full-stack web application to retroactively calculate and visualize cycling power from GPX files",
    "year": "2026",
    "category": "fullstack",
    "status": "active",
    "projectType": "software-project",
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "major",
    "aiUtilization": "no-ai",
    "description": "A full-stack, open-source web application designed to analyze GPS track data (GPX files) and retroactively calculate a cyclist's power output (watts) using physical equations. The platform integrates a FastAPI Python backend for mathematical calculations, coordinate smoothing, and database persistence, with a React frontend featuring Chart.js analytics and Mapbox 3D terrain animations.",
    "purpose": "To democratize cycling analytics by reverse-engineering power output without expensive physical power meters, and providing a highly engaging 3D visualization of rides.",
    "technologies": [
      "React",
      "FastAPI",
      "Python",
      "SQLite",
      "Mapbox GL JS",
      "Chart.js",
      "Docker"
    ],
    "dependencies": [
      "FastAPI",
      "SQLAlchemy",
      "Pillow",
      "Pandas",
      "NumPy",
      "Mapbox GL JS",
      "Chart.js"
    ],
    "expertise": [
      "Full Stack Development",
      "Data Science & Physics Modeling",
      "3D Geospatial Visualization",
      "API Development"
    ],
    "strengths": [
      "Physics modeling (gravity, rolling resistance, aerodynamic drag, kinetic energy)",
      "3D digital elevation model (DEM) map tracking and path animations",
      "Interactive synchronized charts (speed, power, elevation)",
      "Bike configurations and user weight/CdA biological profiles support"
    ],
    "limitations": [
      "Aero drag calculations assume static environmental wind conditions",
      "Requires high-quality GPX files with fine-grained timestamp points",
      "Mapbox features require a Mapbox API token"
    ],
    "installation": "git clone git@github.com:chrisb09/cycling_power_estimator.git\ncd cycling_power_estimator\ndocker-compose up --build -d",
    "usage": "# Access the web app at http://localhost\n# Register a user profile and configure your bike mass & position\n# Upload a GPX file and view the calculated power stats & 3D playback",
    "roadmap": [
      "Integrate open-source elevation APIs to auto-correct GPS elevation errors",
      "Support Strava API integration for automatic ride syncing"
    ],
    "repos": [
      {
        "name": "cycling_power_estimator",
        "url": "https://github.com/chrisb09/cycling_power_estimator",
        "type": "github"
      }
    ],
    "mirrors": [],
    "screenshots": [],
    "logo": "/images/projects/cycling-power-estimator/logo.png"
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
    "screenshots": [],
    "logo": "/images/projects/exam-system-backend/logo.png"
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
    "screenshots": [],
    "logo": "/images/projects/ferienw-am-meer-modernization/logo.png"
  },
  {
    "id": "find-duplicates",
    "name": "find-duplicates",
    "tagline": "Python script to locate duplicate files and replace them with symbolic/hard links",
    "year": "2022-2025",
    "category": "utility",
    "status": "active",
    "projectType": "script-small",
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "minor",
    "aiUtilization": "no-ai",
    "description": "A Python command-line script that crawls source and destination directories to detect duplicate files by hashing. It can automatically delete target duplicates and replace them with symlinks or hardlinks, optimizing disk space while preserving file organization.",
    "purpose": "To free up storage space (e.g. seeding torrents while maintaining files in library folders on different drives) without duplicating file contents.",
    "technologies": [
      "Python",
      "Bash"
    ],
    "dependencies": [
      "Python 3"
    ],
    "expertise": [
      "Data Verification",
      "Scripting",
      "Storage Management"
    ],
    "strengths": [
      "Uses speculative caching (filename+size) for extremely fast subsequent runs",
      "Supports dry-run mode by default to preview changes safely",
      "Generates clean links (symlinks or hardlinks) without duplicating files",
      "Zero external dependencies (uses Python standard library only)"
    ],
    "limitations": [
      "Hardlinks cannot span across different physical drives",
      "Speculative caching might mismatch files with identical name/size but different content",
      "File system operations modify target files directly (recommends backup)"
    ],
    "installation": "git clone git@github.com:chrisb09/find-duplicates.git\ncd find-duplicates\nchmod +x find_duplicates.py",
    "usage": "# Perform a dry-run check:\npython3 find_duplicates.py /path/to/source /path/to/destination\n\n# Create symlinks for duplicates:\npython3 find_duplicates.py --softlink /path/to/source /path/to/destination",
    "roadmap": [
      "Improve caching validation algorithms",
      "Provide interactive confirmation prompt before link creation"
    ],
    "repos": [
      {
        "name": "find-duplicates",
        "url": "https://github.com/chrisb09/find-duplicates",
        "type": "github"
      }
    ],
    "mirrors": [],
    "screenshots": []
  },
  {
    "id": "firecord",
    "name": "Firecord",
    "tagline": "Virtual distributed object memory and cache coherence library for Java and Minecraft servers",
    "year": "2023 - Present",
    "category": "backend",
    "status": "experimental",
    "projectType": "software-project",
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "minor",
    "aiUtilization": "no-ai",
    "description": "An experimental virtual distributed shared object memory system for Java. It combines Redis as a backing store with an invalidation-based cache coherence protocol via Redis Pub/Sub, allowing multiple independent processes or Minecraft servers to interact with synchronized objects as if they were local references. Field-level updates and reference changes are intercepted and broadcasted automatically using AspectJ compile-time bytecode weaving.",
    "purpose": "To provide a low-latency state synchronization layer for Minecraft server environments (Spigot/Paper) and proxies (Velocity) where tick times are constrained to 50ms, bypassing the serialization overhead of traditional ORMs or Redisson's explicit map/list updates.",
    "technologies": [
      "Java",
      "Redis",
      "AspectJ",
      "Maven",
      "TCP/IP & Pub/Sub"
    ],
    "dependencies": [
      "AspectJ Runtime (aspectjrt)",
      "Jedis (Redis Java Client)",
      "Spigot/Paper API (optional, for Minecraft servers)",
      "BungeeCord/Velocity API (optional, for Minecraft proxies)",
      "JLine (optional, for standalone CLI)"
    ],
    "expertise": [
      "Distributed Shared Memory",
      "Cache Coherence Protocols",
      "Bytecode Instrumentation & Weaving",
      "Spigot & Velocity Plugin Development",
      "Pub/Sub Messaging Architectures"
    ],
    "strengths": [
      "Transparent distributed shared object space using AspectJ compile-time weaving to intercept field assignments",
      "Highly efficient field-level incremental updates instead of full-object serialization",
      "Native Spigot, Paper, and Velocity integration for high-performance Minecraft multi-server networks",
      "Redis Pub/Sub invalidation protocol maintaining cache coherence across multiple nodes",
      "Standalone console mode using JLine for interactive distributed testing"
    ],
    "limitations": [
      "Requires AspectJ compile-time weaving plugins configured in the project's build pipeline",
      "Increased memory usage due to object caching across all nodes",
      "Prototype status lacking mature distributed features like garbage collection, sorted set support, or parent references"
    ],
    "installation": "<!-- Add Firecord repository and dependency in pom.xml -->\n<dependency>\n    <groupId>net.legendofwar.firecord</groupId>\n    <artifactId>Firecord</artifactId>\n    <version>${firecord.version}</version>\n</dependency>\n\n<!-- Requires aspectj-maven-plugin configured for compile-time weaving -->\n<plugin>\n    <groupId>org.codehaus.mojo</groupId>\n    <artifactId>aspectj-maven-plugin</artifactId>\n    <version>${aspectj.plugin.version}</version>\n    <configuration>\n        <aspectLibraries>\n            <aspectLibrary>\n                <groupId>org.aspectj</groupId>\n                <artifactId>aspectjrt</artifactId>\n            </aspectLibrary>\n        </aspectLibraries>\n    </configuration>\n</plugin>",
    "usage": "// 1. Initialize Firecord for Spigot or Standalone mode\nFirecord.init(NodeType.SPIGOT);\n\n// 2. Define a shared object extending AbstractObject\npublic final class PlayerData extends AbstractObject {\n    // Synchronized fields using R-types (or primitives woven by AspectJ)\n    private RInteger level = new RInteger(new Bytes(\"level\"));\n    private RString rank = new RString(new Bytes(\"rank\"));\n    \n    public PlayerData(Bytes key) {\n        super(key);\n    }\n}\n\n// 3. Load or create the object from the distributed memory\nPlayerData data = (PlayerData) AbstractData.create(new Bytes(\"player-123\"));\n\n// 4. Modify fields - changes are automatically woven and broadcasted to other nodes\ndata.getLevel().set(100);",
    "roadmap": [
      "Implement distributed garbage collection for expired memory keys",
      "Support sorted sets (ZSET) synchronization",
      "Optimize AspectJ aspects to reduce runtime memory overhead",
      "Add support for parent-child relationship tracking in nested objects"
    ],
    "repos": [
      {
        "name": "firecord",
        "url": "https://gitlab.com/legend-of-phoenix/firecord",
        "type": "gitlab"
      }
    ],
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
    ],
    "logo": "/images/projects/firecord/logo.png"
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
    "id": "ibus",
    "name": "Ibus",
    "tagline": "Java Tool to Encode Files into ARGB Images for Unlimited Cloud Storage",
    "year": "2019",
    "category": "utility",
    "status": "completed",
    "projectType": "script-small",
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "none",
    "aiUtilization": "no-ai",
    "description": "A Java-based CLI utility that encodes files into ARGB pixels of PNG images and decodes them back to their original state. By representing files as images, it enables using unlimited photo cloud storage services (like Google Photos or Amazon Photos) as a backup destination.",
    "purpose": "To bypass file-hosting limitations on cloud providers by translating binary files and directory structures into visual image files.",
    "technologies": [
      "Java",
      "Cryptography (AES)"
    ],
    "dependencies": [
      "Java 8+"
    ],
    "expertise": [
      "Data Encoding",
      "Cryptography",
      "File Systems"
    ],
    "strengths": [
      "Translates arbitrary files into standard PNG images (up to 64MB per image)",
      "Supports optional 128-bit AES encryption/decryption for data security",
      "Restores original directory structures and file modification timestamps (since v2.1)",
      "Splits large files automatically across multiple image sequences"
    ],
    "limitations": [
      "Google/Amazon Photos API restrictions limit automated cloud integration",
      "Memory-bound and single-threaded encoding",
      "Losing the AES key results in permanent data loss"
    ],
    "installation": "git clone git@gitlab.com:christianbrinkmann/ibus.git\ncd ibus\n# Use pre-built jar in download/ or build it from src/",
    "usage": "# Encode/Decode data with AES key:\njava -jar Ibus.jar dataDir --key=YOUR_SECRET_KEY\n\n# Configure size constraints:\njava -jar Ibus.jar dataDir --key=YOUR_KEY --minsize=256 --maxsize=4000",
    "roadmap": [
      "Add native file system integration",
      "Optimize encoding/decoding performance",
      "Integrate desktop context menu shortcuts"
    ],
    "repos": [
      {
        "name": "ibus",
        "url": "https://gitlab.com/christianbrinkmann/ibus",
        "type": "gitlab"
      }
    ],
    "mirrors": [],
    "screenshots": [],
    "logo": "/images/projects/ibus/logo.png"
  },
  {
    "id": "image-rename-manual-gui",
    "name": "Manual Media Renaming GUI",
    "tagline": "GTK Desktop Application for Quick Manual Media Renaming",
    "year": "2020-2023",
    "category": "utility",
    "status": "archived",
    "projectType": "software-project",
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "none",
    "aiUtilization": "no-ai",
    "description": "A PyGObject and GTK-based desktop application to preview and rename media files (images, animated GIFs, and videos) quickly and comfortably with custom keybindings, resolution scaling, and filename validation.",
    "purpose": "To streamline manual renaming and filtering/deletion of large sets of media files through an efficient visual interface with keyboard shortcuts.",
    "technologies": [
      "Python",
      "GTK",
      "Pillow",
      "GStreamer"
    ],
    "dependencies": [
      "PyGObject",
      "Pillow"
    ],
    "expertise": [
      "GUI Development",
      "Media Processing",
      "Desktop Applications"
    ],
    "strengths": [
      "Supports multiple image formats (.png, .jpg, .gif, .bmp) and video formats (.mp4, .mkv, .avi, .webm)",
      "Real-time video/GIF playback controls (pause/resume/restart via spacebar)",
      "Color-coded validation indicating current name suitability (red to green)",
      "Fully keyboard-navigable for fast bulk processing"
    ],
    "limitations": [
      "Legacy GTK bindings can be complex to install",
      "GUI scaling is basic and not fully optimized",
      "GStreamer setup varies across different desktop environments"
    ],
    "installation": "python3 -m pip install Pillow\n# Install GStreamer and PyGObject bindings depending on system packaging\npython3 main.py <source_dir> <target_dir>",
    "usage": "# Run with source and target directories:\npython3 main.py --source=/path/to/source --target=/path/to/target\n\n# Key bindings:\n# ENTER - Accept renaming\n# DELETE - Delete file\n# SPACE - Pause/resume video or GIF\n# F11 - Toggle fullscreen\n# ESC - Exit application",
    "roadmap": [
      "Superceded by CrystalBatch (rewritten for broader file renaming capabilities)"
    ],
    "repos": [
      {
        "name": "image-rename-manual-gui",
        "url": "https://gitlab.com/christianbrinkmann/image-rename-manual-gui",
        "type": "gitlab"
      }
    ],
    "relatedProjects": [
      {
        "name": "CrystalBatch",
        "relation": "Successor project (moved to GitHub)",
        "url": "https://github.com/chrisb09/crystalbatch"
      }
    ],
    "mirrors": [],
    "screenshots": [
      "/images/projects/image-rename-manual-gui/screenshot.jpg",
      "/images/projects/image-rename-manual-gui/screenshot.png",
      "/images/projects/image-rename-manual-gui/screenshot_large.png"
    ],
    "logo": "/images/projects/image-rename-manual-gui/logo.png"
  },
  {
    "id": "jda-chewtils",
    "name": "JDA-Chewtils",
    "tagline": "Modern, modular tools and utilities extension library for JDA Discord bots",
    "year": "2025",
    "category": "library",
    "status": "active",
    "projectType": "software-project",
    "role": "contributor",
    "sourceType": "open-source",
    "aiUsage": "none",
    "aiUtilization": "no-ai",
    "description": "A modern, modular fork of the classic JDA-Utilities library that provides boilerplate reduction tools for Java Discord API (JDA) bots. It includes helper structures for menu pagination, command parsing, and OAuth2 integration. I contributed to JDA 6.1.1 compatibility upgrades.",
    "purpose": "To simplify Java-based Discord bot development by providing reusable structures for command registering and UI menus.",
    "technologies": [
      "Java",
      "Gradle",
      "JDA"
    ],
    "dependencies": [
      "JDA 5.x / 6.x"
    ],
    "expertise": [
      "Library Design",
      "API Integration",
      "Java Software Development"
    ],
    "strengths": [
      "Modular library design allowing developers to import only required features",
      "Provides fully customizable paginated menu systems",
      "Actively maintained to support modern JDA versions",
      "Simplifies slash command registration and permissions handling"
    ],
    "limitations": [
      "Tightly coupled to DV8FromTheWorld/JDA API updates",
      "Requires Java 8 or higher"
    ],
    "installation": "// Gradle dependency integration:\nimplementation 'pw.chew:jda-chewtils:JDA-UTILITIES-VERSION'",
    "usage": "// Define a basic command:\npublic class PingCommand extends Command {\n    public PingCommand() {\n        this.name = \"ping\";\n        this.help = \"responds with pong\";\n    }\n    @Override\n    protected void execute(CommandEvent event) {\n        event.reply(\"Pong!\");\n    }\n}",
    "roadmap": [
      "Expand installation contexts for modern Discord application actions"
    ],
    "repos": [
      {
        "name": "JDA-Chewtils",
        "url": "https://github.com/Chew/JDA-Chewtils",
        "type": "github"
      }
    ],
    "mirrors": [],
    "screenshots": []
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
    "id": "map-color-convert",
    "name": "map-color-convert",
    "tagline": "Paint.NET plugin to preview and convert images to Minecraft map color palettes",
    "year": "2024-2025",
    "category": "utility",
    "status": "active",
    "projectType": "script-small",
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "minor",
    "aiUtilization": "no-ai",
    "description": "A Paint.NET (PDN) filter plugin written in C# that simplifies converting standard images to use only the official Minecraft map color palette. This allows previewing how pixel art and custom maps will look in-game before building them.",
    "purpose": "To preview and map standard RGB image colors onto the limited color palette supported by Minecraft in-game maps.",
    "technologies": [
      "C#",
      "Paint.NET API",
      "Python",
      "Java"
    ],
    "dependencies": [
      "Paint.NET"
    ],
    "expertise": [
      "Image Processing",
      "Plugin Development",
      "Minecraft Mechanics"
    ],
    "strengths": [
      "Translates arbitrary colors to Minecraft-compatible map colors",
      "Integrates directly into the Paint.NET Effects menu via installer batch script",
      "Provides sample C#, Java, and Python color extractors/mappers",
      "Very fast in-memory execution within the Paint.NET UI"
    ],
    "limitations": [
      "Requires Paint.NET installed on Windows to run the plugin",
      "Does not handle image resizing (Minecraft maps are 128x128 pixels)",
      "Limited to the predefined color palette"
    ],
    "installation": "1. Extract the MinecraftMapColorPalette.zip file.\n2. Execute the batch installer script.\n3. Open Paint.NET and access the plugin from the Effects menu.",
    "usage": "# Open an image in Paint.NET\n# Select Effects -> Color Map -> Minecraft Map Color Palette\n# Preview and apply the palette transformation",
    "roadmap": [
      "Add customizable dither options to improve converted image gradients",
      "Implement automated 128x128 image cropping/splitting options"
    ],
    "repos": [
      {
        "name": "map-color-convert",
        "url": "https://github.com/chrisb09/map-color-convert",
        "type": "github"
      }
    ],
    "mirrors": [],
    "screenshots": [
      "/images/projects/map-color-convert/sample.png"
    ]
  },
  {
    "id": "mega-tor-downloader",
    "name": "mega-tor-downloader",
    "tagline": "Mega.nz Downloader routed through Tor to bypass rate limits",
    "year": "2021-2024",
    "category": "utility",
    "status": "active",
    "projectType": "script-small",
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "none",
    "aiUtilization": "no-ai",
    "description": "A multithreaded Python downloader utility that automates fetching files from Mega.nz using Megatools. It routes requests through a local Tor SOCKS5 proxy, dynamically monitoring download progress and automatically rotating Tor circuits to bypass Mega's IP-based download bandwidth limits.",
    "purpose": "To allow continuous and automated downloading of large datasets from Mega.nz without being blocked or throttled by IP bandwidth quotas.",
    "technologies": [
      "Python",
      "Tor",
      "Bash",
      "PHP"
    ],
    "dependencies": [
      "megatools",
      "requests",
      "pysocks"
    ],
    "expertise": [
      "Network Routing & Tor",
      "Scripting",
      "Automation",
      "Multithreading"
    ],
    "strengths": [
      "Circumvents Mega.nz bandwidth limits via Tor circuit rotation",
      "Multithreaded queue-based download manager",
      "PHP-based web dashboard to monitor download progress and speeds in real-time",
      "Detailed speed/IP log tracking and timeout validation"
    ],
    "limitations": [
      "Download speed is limited by Tor network bandwidth",
      "Requires local Tor daemon configuration",
      "Requires megatools CLI dependency"
    ],
    "installation": "sudo apt install megatools tor\npip install -r requirements.txt",
    "usage": "# Add a download link to queue:\n./add_to_queue.sh <mega-url>\n\n# Start downloader daemon:\npython3 test.py",
    "roadmap": [
      "Implement automated Tor service configuration check",
      "Provide dockerized setup for headless deployment",
      "Add support for other file hosting platforms"
    ],
    "repos": [
      {
        "name": "mega-tor-downloader",
        "url": "https://gitlab.com/christianbrinkmann/mega-tor-downloader",
        "type": "gitlab"
      }
    ],
    "mirrors": [],
    "screenshots": [],
    "logo": "/images/projects/mega-tor-downloader/logo.png"
  },
  {
    "id": "nudenetv2",
    "name": "NudeNetv2",
    "tagline": "Fork and modernization of NudeNet neural networks for nudity classification and censoring",
    "year": "2024-2025",
    "category": "library",
    "status": "active",
    "projectType": "software-project",
    "role": "fork-maintainer",
    "sourceType": "open-source",
    "aiUsage": "none",
    "aiUtilization": "ai-powered",
    "description": "A fork of the v2 branch of NudeNet, a popular library for nudity classification, detection, and selective censoring. This fork was created to restore functionality to the library after the original repository's model downloads broke due to GitHub release access changes. It hosts the classification and detection ONNX models directly on GitLab and includes custom extensions, such as support for custom model directory paths via both constructor arguments and environment variables.",
    "purpose": "To restore and maintain a fully functional, easy-to-use Python package for nudity classification and censoring without requiring official Tor clients or browser logins to download pre-trained weights.",
    "technologies": [
      "Python",
      "ONNX Runtime",
      "OpenCV",
      "Pillow",
      "Deep Learning"
    ],
    "dependencies": [
      "onnxruntime",
      "opencv-python-headless",
      "pillow",
      "pydload",
      "scikit-image"
    ],
    "expertise": [
      "Library Maintenance",
      "Deep Learning Inference",
      "ONNX Models",
      "Python Package Distribution"
    ],
    "strengths": [
      "Fully functional classifier and detector restored from the broken original NudeNet v2 branch",
      "ONNX models hosted reliably on GitLab raw storage for direct downloads",
      "Added support for custom model directories via constructor parameter or NUDENET_MODEL_DIR environment variable",
      "Cleaned codebase of indecent images in documentation",
      "Easy installation and PyPI publication packaging"
    ],
    "limitations": [
      "Deep learning model accuracy depends on pre-trained NudeNet weights",
      "Requires downloading large ONNX checkpoint files on first initialization",
      "Inference speed is limited by CPU unless GPU-accelerated onnxruntime-gpu is configured"
    ],
    "installation": "pip install --upgrade NudeNetv2",
    "usage": "from NudeNetv2 import NudeClassifier, NudeDetector\n\n# Initialize and download models\nclassifier = NudeClassifier()\ndetector = NudeDetector()\n\n# Classify an image\nresult = classifier.classify('path_to_image.jpg')\nprint(result)\n\n# Detect and censor parts\nboxes = detector.detect('path_to_image.jpg')\ndetector.censor('path_to_image.jpg', out_path='censored.jpg', parts_to_blur=['sexually_explicit'])",
    "roadmap": [
      "Optimize video frame extraction performance",
      "Support more lightweight ONNX model quantization options",
      "Improve batch inference pipelines"
    ],
    "repos": [
      {
        "name": "nudenetv2",
        "url": "https://gitlab.com/christianbrinkmann/nudenetv2",
        "type": "gitlab",
        "excludeFirstCommit": true
      }
    ],
    "mirrors": [],
    "screenshots": [],
    "relatedProjects": [
      {
        "name": "NudeNet",
        "relation": "Forked from",
        "url": "https://github.com/notAI-tech/NudeNet"
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
    "aiUsage": "minor",
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
    ],
    "logo": "/images/projects/pacstall-programs/logo.svg"
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
    "id": "qbmanage",
    "name": "qbmanage",
    "tagline": "CLI Tool for Auditing and Cleaning up qBittorrent Instances",
    "year": "2025-Present",
    "category": "utility",
    "status": "active",
    "projectType": "script-small",
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "minor",
    "aiUtilization": "no-ai",
    "description": "A Python-based command-line utility for auditing and cleaning up torrents and files in a qBittorrent instance. It features tracker status checking, finding orphaned/unused files on disk, and identifying unlinked hardlinks to automate cleaning leftovers safely with dry-run protection.",
    "purpose": "To manage qBittorrent instances, especially in setups where downloads are hardlinked to media folders, by cleaning dead tracker torrents and orphaned download files.",
    "technologies": [
      "Python",
      "qBittorrent API",
      "YAML"
    ],
    "dependencies": [
      "qbittorrent-api",
      "PyYAML",
      "pandas"
    ],
    "expertise": [
      "Automation",
      "Scripting",
      "Storage Management",
      "API Integration"
    ],
    "strengths": [
      "Dry-run inspection before performing any deletion",
      "Uses regex filters to group/remove torrents based on tracker messages",
      "Designed around hardlink setups to safely detect orphaned content",
      "Generates detailed logs and tables for selected torrents/files"
    ],
    "limitations": [
      "Optimized for specific hardlink setups; requires extra caution on standard copy setups",
      "Requires active Web UI connection with valid credentials",
      "Requires Python 3.10+"
    ],
    "installation": "git clone git@github.com:chrisb09/qbmanage.git\ncd qbmanage\npip install -r requirements.txt",
    "usage": "# Check connection and count torrents:\npython3 qbmanage.py status\n\n# Audit orphaned files (dry-run):\npython3 qbmanage.py unusedfiles --full\n\n# Safely remove unlinked torrents:\npython3 qbmanage.py unlinkedfiles --include-categories 'movies' --delete",
    "roadmap": [
      "Add support for dockerized daemon runs",
      "Extend notification support (e.g. Discord, Telegram) upon successful cleanup runs"
    ],
    "repos": [
      {
        "name": "qbmanage",
        "url": "https://github.com/chrisb09/qbmanage",
        "type": "github"
      }
    ],
    "mirrors": [],
    "screenshots": []
  },
  {
    "id": "redis-dump-load",
    "name": "redis-dump-load",
    "tagline": "Redis Data Set Dumper and Loader",
    "year": "2023",
    "category": "utility",
    "status": "maintenance",
    "projectType": "script-small",
    "role": "fork-maintainer",
    "sourceType": "open-source",
    "aiUsage": "none",
    "aiUtilization": "no-ai",
    "description": "A command-line tool and Python module to dump Redis datasets into JSON files and restore them. Stream support allows handling large databases efficiently.",
    "purpose": "To facilitate long-term storage, transfer, and version-controlling of Redis datasets in a clean, streaming-capable text format (JSON).",
    "technologies": [
      "Python",
      "Redis",
      "JSON"
    ],
    "dependencies": [
      "redis"
    ],
    "expertise": [
      "Data Processing",
      "Scripting",
      "Backup Solutions"
    ],
    "strengths": [
      "Compatible with redis-dump",
      "Streams data to minimize memory usage",
      "Preserves TTL and expiration times",
      "Can be used as a CLI utility or Python module"
    ],
    "limitations": [
      "Dumps to a single JSON file",
      "Loading speed depends on Redis client latency",
      "Requires external dependencies (ijson/jsaone) for streaming load"
    ],
    "installation": "pip install redis-dump-load\n# Or run directly:\npython redisdl.py --help",
    "usage": "# Dump database to file\npython redisdl.py -o dump.json\n\n# Load database from file\npython redisdl.py -l dump.json",
    "roadmap": [
      "Enhance support for newer Redis data types",
      "Optimize loading performance"
    ],
    "repos": [
      {
        "name": "redis-dump-load",
        "url": "https://github.com/chrisb09/redis-dump-load",
        "type": "github"
      }
    ],
    "mirrors": [],
    "screenshots": []
  },
  {
    "id": "redis-load-store",
    "name": "redis_load_store",
    "tagline": "Redis Database to Base64 Text Files Backup Utility",
    "year": "2024",
    "category": "utility",
    "status": "active",
    "projectType": "script-small",
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "minor",
    "aiUtilization": "no-ai",
    "description": "A single-file Python 3 utility to split and backup a Redis database into multiple base64 URL-safe text files, making backups git-friendly and easily restorable.",
    "purpose": "To create incremental, text-based, and human-readable backups of Redis data keys and values (handling binary data cleanly via base64) instead of monolithic binary RDB dumps.",
    "technologies": [
      "Python",
      "Redis",
      "Base64"
    ],
    "dependencies": [
      "redis"
    ],
    "expertise": [
      "Data Processing",
      "Scripting",
      "Backup Solutions"
    ],
    "strengths": [
      "Stores database keys as individual base64 URL-safe files",
      "Great for version control (git) tracking changes incrementally",
      "Supports string, list, set, zset, hash, and stream types",
      "Restores TTL and expiration times relative to restore time"
    ],
    "limitations": [
      "Inefficient storage size due to base64 encoding",
      "Unix socket support is untested",
      "use_expireat option is currently unimplemented"
    ],
    "installation": "git clone https://gitlab.com/christianbrinkmann/redis_load_store.git\ncd redis_load_store\npip install -r requirements.txt",
    "usage": "# Store Redis db to folder\n./redis_load_store.py store backup_folder --empty\n\n# Restore Redis db from folder\n./redis_load_store.py load backup_folder --empty",
    "roadmap": [
      "Implement and test --use_expireat",
      "Add test coverage for unix sockets",
      "Optimize file creation and I/O performance"
    ],
    "repos": [
      {
        "name": "redis_load_store",
        "url": "https://gitlab.com/christianbrinkmann/redis_load_store",
        "type": "gitlab"
      }
    ],
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
    "projectType": "software-project",
    "role": "main-author",
    "sourceType": "open-source",
    "aiUsage": "none",
    "aiUtilization": "no-ai",
    "description": "A distributed client-server web scraping system written in Python. It features a centralized coordinator (TCP socket server) managing a job queue and multiple regional Docker-based scraping clients. The clients utilize a custom-built multiprocessed task scheduling library (torpyjob) and a custom-modified pure-Python Tor client library (torpy) to run scraping tasks over isolated Tor circuits with country-specific exit node routing to bypass rate-limiting. Scraped unstructured HTML benchmark data is parsed and returned to the server, which aggregates it in a centralized SQLite database.",
    "purpose": "To collect large-scale, multi-category hardware benchmark statistics across CPUs, GPUs, SSDs, HDDs, and RAM by distributing traffic across multiple Tor exit nodes and regional IP addresses to prevent rate-limit blocks.",
    "technologies": [
      "Python",
      "TCP Socket Programming",
      "Tor Network & Routing",
      "Docker & Docker Compose",
      "SQLite",
      "Multiprocessing & Multi-threading",
      "SOCKS5 Proxying"
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
      "Multiprocessed Task Scheduling"
    ],
    "strengths": [
      "Distributed client-server architecture coordinating multiple concurrent scraping workers",
      "Custom scheduling library (torpyjob) managing concurrent jobs with unique Tor exit node IPs",
      "Custom Tor library (torpy) modifications supporting SocksServer control, exit node selection, and dynamic port allocation",
      "Tor network exit node manipulation to rotate IP addresses by country code to bypass rate limiting",
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
    ],
    "logo": "/images/projects/userbenchmark-scraper/logo.png"
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
