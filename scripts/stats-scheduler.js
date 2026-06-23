const { exec } = require('child_process');

// Run stats update every 6 hours by default (can be overridden via STATS_UPDATE_INTERVAL_HOURS)
const intervalHours = parseFloat(process.env.STATS_UPDATE_INTERVAL_HOURS) || 6;
const INTERVAL_MS = intervalHours * 60 * 60 * 1000;

function runUpdate() {
  console.log('[Scheduler] Running npm run update-stats...');
  exec('npm run update-stats', (error, stdout, stderr) => {
    if (error) {
      console.error('[Scheduler] Error updating stats:', error);
      return;
    }
    if (stdout) console.log(stdout.trim());
    if (stderr) console.error(stderr.trim());
    console.log('[Scheduler] Stats update finished. Triggering build...');
    
    // Trigger build after stats update to compile and bundle the new stats.json
    exec('npm run build', (buildError, buildStdout, buildStderr) => {
      if (buildError) {
        console.error('[Scheduler] Build error after stats update:', buildError);
        return;
      }
      if (buildStdout) console.log(buildStdout.trim());
      console.log('[Scheduler] Rebuilt portfolio successfully after stats update.');
    });
  });
}

// Run immediately on startup
runUpdate();

// Set interval for periodic updates
setInterval(runUpdate, INTERVAL_MS);
console.log(`[Scheduler] Registered stats update scheduler to run every ${intervalHours} hours.`);
