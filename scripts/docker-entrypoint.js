const { spawn } = require('child_process');

console.log('[Docker Entrypoint] Starting developer portfolio services...');

// Helper to run a process and pipe stdout/stderr
function runProcess(command, args, name) {
  const child = spawn(command, args, { shell: true });
  
  child.stdout.on('data', (data) => {
    // Prefix each line with service name for clear logs
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => console.log(`[${name}] ${line}`));
  });
  
  child.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => console.error(`[${name}] ${line}`));
  });
  
  child.on('close', (code) => {
    console.log(`[${name}] Exited with code ${code}`);
  });
  
  return child;
}

// 1. Run initial build
console.log('[Docker Entrypoint] Running initial build...');
const build = spawn('npm', ['run', 'build'], { shell: true, stdio: 'inherit' });

build.on('close', (code) => {
  if (code !== 0) {
    console.error(`[Docker Entrypoint] Initial build failed with code ${code}`);
    process.exit(code);
  }
  
  console.log('[Docker Entrypoint] Initial build succeeded. Starting background services...');
  
  // 2. Start project config watcher
  runProcess('node', ['scripts/watch-projects.js'], 'Watcher');
  
  // 3. Start stats update scheduler
  runProcess('node', ['scripts/stats-scheduler.js'], 'Scheduler');
});
