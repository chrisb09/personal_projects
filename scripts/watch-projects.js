const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const projectsDir = path.join(__dirname, '../projects');
const compileScriptPath = path.join(__dirname, 'compile-projects.js');

let debounceTimer = null;

function runCompilation() {
  console.log(`[Watcher] Changes detected! Running compile-projects.js...`);
  exec(`node "${compileScriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`[Watcher] Compilation error:`, error);
      return;
    }
    if (stdout) console.log(stdout.trim());
    if (stderr) console.error(stderr.trim());
    console.log(`[Watcher] Compilation finished.`);
  });
}

function scheduleCompile() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    console.log(`[Watcher] File changed. Postponing compilation (waiting for 10s of inactivity)...`);
  } else {
    console.log(`[Watcher] File changed. Scheduling compilation in 10s...`);
  }

  debounceTimer = setTimeout(() => {
    runCompilation();
    debounceTimer = null;
  }, 10000); // 10s delay
}

if (!fs.existsSync(projectsDir)) {
  console.error(`[Watcher] Projects directory not found at ${projectsDir}`);
  process.exit(1);
}

console.log(`[Watcher] Watching directory: ${projectsDir} for changes...`);

// Watch recursively
fs.watch(projectsDir, { recursive: true }, (eventType, filename) => {
  if (filename) {
    // Ignore hidden files and editor backups
    if (filename.startsWith('.') || filename.endsWith('~') || filename.includes('.goutputstream')) {
      return;
    }
    console.log(`[Watcher] Event: ${eventType} on file: ${filename}`);
    scheduleCompile();
  }
});
