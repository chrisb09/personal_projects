/**
 * This module provides metadata for external scripts.
 * Your external stats collection script can call this to get information
 * about which projects need stats and where their repositories are located.
 * 
 * This endpoint is read-only and does not accept writes, keeping your site secure.
 */

import { projects } from '@/config/projects';

export interface ProjectMetadata {
  id: string;
  name: string;
  repoUrl?: string;
  docsUrl?: string;
  demoUrl?: string;
}

export interface MetadataResponse {
  generatedAt: string;
  projects: ProjectMetadata[];
  instructions: string;
}

/**
 * Get metadata for all projects.
 * This is used by external scripts to know which repositories
 * need their stats collected.
 */
export function getProjectsMetadata(): MetadataResponse {
  return {
    generatedAt: new Date().toISOString(),
    projects: projects.map(project => ({
      id: project.id,
      name: project.name,
      repoUrl: project.repoUrl,
      docsUrl: project.docsUrl,
      demoUrl: project.demoUrl,
    })),
    instructions: `
This metadata is provided for external scripts to collect stats.
To update project stats:
1. Fetch this endpoint to get project IDs and repository URLs
2. Collect stats for each repository (GitHub API, git log, etc.)
3. Write the collected data to public/stats.json with the following structure:
{
  "lastUpdated": "ISO-8601-timestamp",
  "projects": {
    "project-id": {
      "stats": {
        "stars": number,
        "commits": number,
        "branches": number,
        "lastCommit": "ISO-8601-timestamp"
      },
      "loc": {
        "total": number,
        "byLanguage": {
          "language-name": number
        }
      }
    }
  }
}
4. The website will automatically pick up changes within 60 seconds
5. No write-capable endpoint needed - the site only reads from stats.json
    `.trim(),
  };
}
