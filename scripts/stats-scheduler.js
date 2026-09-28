const { exec } = require('child_process');

// Run stats update every 6 hours by default (can be overridden via STATS_UPDATE_INTERVAL_HOURS)
const intervalHours = parseFloat(process.env.STATS_UPDATE_INTERVAL_HOURS) || 6;
const INTERVAL_MS = intervalHours * 60 * 60 * 1000;

function runBuild() {
  console.log('[Scheduler] Triggering build...');
  exec('npm run build', (buildError, buildStdout, buildStderr) => {
    if (buildError) {
      console.error('[Scheduler] Build error after stats update:', buildError);
      return;
    }
    if (buildStdout) console.log(buildStdout.trim());
    console.log('[Scheduler] Rebuilt portfolio successfully after stats update.');
  });
}

function runActivityUpdate(done) {
  console.log('[Scheduler] Running npm run update-activity...');
  exec('npm run update-activity', (error, stdout, stderr) => {
    if (error) console.error('[Scheduler] Activity update failed:', error);
    if (stdout) console.log(stdout.trim());
    if (stderr) console.error(stderr.trim());
    done();
  });
}

function runUpdate() {
  console.log('[Scheduler] Running npm run update-stats...');
  exec('npm run update-stats', (error, stdout, stderr) => {
    if (error) {
      console.error('[Scheduler] Error updating stats:', error);
      // Activity still uses whatever clones are available.
      runActivityUpdate(runBuild);
      return;
    }
    if (stdout) console.log(stdout.trim());
    if (stderr) console.error(stderr.trim());
    console.log('[Scheduler] Stats update finished.');

    // The local clones are up to date now, so refresh the activity snapshot
    // before rebuilding; the build copies public/ into the served dist/.
    runActivityUpdate(runBuild);
  });
}

// Run immediately on startup
runUpdate();

// Set interval for periodic updates
setInterval(runUpdate, INTERVAL_MS);
console.log(`[Scheduler] Registered stats update scheduler to run every ${intervalHours} hours.`);
