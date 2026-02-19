import type { Project } from '@/types/project';

export interface StatsData {
  lastUpdated: string;
  projects: Record<string, {
    stats?: Project['stats'];
    loc?: Project['loc'];
  }>;
}

// Cache the stats in memory with timestamp
let cachedStats: StatsData | null = null;
let lastFetchTime: number = 0;
const CACHE_CHECK_INTERVAL = 60000; // Check for updates every 60 seconds

/**
 * Fetches stats from the public/stats.json file with cache-busting.
 * Uses the file's modification time to determine if a refresh is needed.
 * This allows external scripts to update stats.json and have the site
 * automatically pick up changes without recompilation.
 */
export async function fetchStats(): Promise<StatsData> {
  const now = Date.now();
  
  // If we have cached stats and haven't exceeded the check interval, return cached version
  if (cachedStats && (now - lastFetchTime) < CACHE_CHECK_INTERVAL) {
    return cachedStats;
  }

  try {
    // Add a cache-busting query parameter with current timestamp
    const response = await fetch(`/stats.json?t=${now}`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.status}`);
    }

    const data: StatsData = await response.json();
    cachedStats = data;
    lastFetchTime = now;
    
    return data;
  } catch (error) {
    console.error('[v0] Failed to fetch stats.json:', error);
    
    // Return empty stats as fallback if fetch fails
    return {
      lastUpdated: new Date().toISOString(),
      projects: {},
    };
  }
}

/**
 * Merges fetched stats with project data.
 * This allows projects to have their stats updated without recompilation.
 */
export function mergeStatsWithProjects(projects: Project[], stats: StatsData): Project[] {
  return projects.map(project => {
    const projectStats = stats.projects[project.id];
    
    return {
      ...project,
      stats: projectStats?.stats || project.stats,
      loc: projectStats?.loc || project.loc,
    };
  });
}

/**
 * Force refresh the stats cache.
 * Useful when you want to immediately load the latest stats.
 */
export function invalidateStatsCache(): void {
  cachedStats = null;
  lastFetchTime = 0;
}
