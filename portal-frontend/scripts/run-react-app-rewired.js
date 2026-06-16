const { spawn } = require('child_process');

const command = process.argv[2];

if (!command) {
  console.error('Usage: node scripts/run-react-app-rewired.js <start|build>');
  process.exit(1);
}

const reactAppRewiredBin = require.resolve('react-app-rewired/bin/index.js');

const child = spawn(
  process.execPath,
  [reactAppRewiredBin, command],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--openssl-legacy-provider',
    },
  }
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
