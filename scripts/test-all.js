const { spawnSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Monorepo Test Suite (Sequential execution)...\n');

// 1. Dynamic Discovery via pnpm
console.log('🔍 Discovering workspace packages...');
const pnpmListCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const listResult = spawnSync(pnpmListCmd, ['m', 'ls', '--json', '--depth', '-1'], {
  encoding: 'utf8',
  shell: true,
});

if (listResult.status !== 0) {
  console.error('❌ Failed to list packages via pnpm');
  process.exit(1);
}

let packages = [];
try {
  packages = JSON.parse(listResult.stdout);
} catch (e) {
  console.error('❌ Failed to parse pnpm output');
  process.exit(1);
}

// Filter out the root package and sort by name to ensure consistent order
const projects = packages
  .filter((pkg) => pkg.path !== process.cwd()) // Exclude root
  .sort((a, b) => a.name.localeCompare(b.name));

console.log(
  `✅ Found ${projects.length} packages to test: ${projects.map((p) => p.name).join(', ')}\n`,
);

// 2. Sequential Execution
for (const project of projects) {
  console.log(`----------------------------------------------------------------`);
  console.log(`▶ Testing: ${project.name}`);
  console.log(`   Path: ${project.path}`);
  console.log(`----------------------------------------------------------------`);

  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = ['vitest', 'run', '--reporter=verbose'];

  const result = spawnSync(command, args, {
    cwd: project.path,
    stdio: 'inherit',
    shell: true,
  });

  if (result.status !== 0) {
    console.error(`\n❌ Tests failed in ${project.name} with exit code ${result.status}`);
    process.exit(result.status || 1);
  }

  console.log(`\n✅ ${project.name} passing.\n`);
}

console.log('🎉 All tests passed successfully!');
process.exit(0);
