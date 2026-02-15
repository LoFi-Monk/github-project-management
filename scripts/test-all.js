const { spawnSync } = require('child_process');
const path = require('path');

// Defined in dependency order
const projects = ['packages/core', 'apps/server'];

console.log('🚀 Starting Monorepo Test Suite (Sequential execution)...\n');

for (const project of projects) {
  console.log(`----------------------------------------------------------------`);
  console.log(`▶ Testing: ${project}`);
  console.log(`----------------------------------------------------------------`);

  const cwd = path.resolve(__dirname, '..', project);

  // Use npx.cmd on Windows, npx on others (though we know we are usually on Windows here)
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = ['vitest', 'run', '--reporter=verbose'];

  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
  });

  if (result.status !== 0) {
    console.error(`\n❌ Tests failed in ${project} with exit code ${result.status}`);
    process.exit(result.status || 1);
  }

  console.log(`\n✅ ${project} passing.\n`);
}

console.log('🎉 All tests passed successfully!');
process.exit(0);
