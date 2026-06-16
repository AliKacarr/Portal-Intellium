const { spawn } = require('child_process');

const command = process.argv[2];

if (!command) {
  console.error('Missing react-app-rewired command.');
  process.exit(1);
}

const major = Number(process.versions.node.split('.')[0]);
const env = { ...process.env };
const currentOptions = (env.NODE_OPTIONS || '')
  .split(/\s+/)
  .filter(Boolean)
  .filter((option) => option !== '--openssl-legacy-provider');

if (major >= 17) {
  currentOptions.push('--openssl-legacy-provider');
}

if (currentOptions.length > 0) {
  env.NODE_OPTIONS = currentOptions.join(' ');
} else {
  delete env.NODE_OPTIONS;
}

const child = spawn(
  process.execPath,
  [require.resolve('react-app-rewired/bin/index.js'), command],
  {
    stdio: 'inherit',
    env,
  }
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
