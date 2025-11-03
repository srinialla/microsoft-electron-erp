#!/usr/bin/env node
import readline from 'node:readline';
import { spawn } from 'node:child_process';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const question = (q) => new Promise((res) => rl.question(q, res));

async function main() {
  const options = [
    { key: '1', name: 'Electron app (desktop)', script: 'dev:electron' },
    { key: '2', name: 'Web app (browser)', script: 'dev:web' },
    { key: '3', name: 'Mobile app (Capacitor - Android/iOS)', script: 'dev:mobile' },
  ];

  const banner =
    '\nSelect target to run:\n' + options.map((o) => `  ${o.key}) ${o.name}`).join('\n') + '\n> ';
  const answer = (await question(banner)).trim();
  rl.close();

  const chosen = options.find((o) => o.key === answer);
  if (!chosen) {
    console.log('Invalid selection. Use 1, 2, or 3.');
    process.exit(1);
  }

  // Mobile requires special handling - build first, then provide instructions
  if (chosen.script === 'dev:mobile') {
    console.log('\n📱 Mobile Development Setup\n');
    console.log('Building web app and syncing with Capacitor...\n');

    // Build and sync
    const buildCmd = spawn('npm', ['run', 'build:mobile'], {
      stdio: 'inherit',
      env: process.env,
      shell: true,
    });

    buildCmd.on('exit', (code) => {
      if (code !== 0) {
        console.error('\n❌ Build failed. Please check errors above.');
        process.exit(code ?? 1);
      }

      console.log('\n✅ Build complete!\n');
      console.log('Next steps:');
      console.log('  • For Android: npm run build:android');
      console.log('  • For iOS: npm run build:ios');
      console.log('  • Or run directly: npm run android:dev');
      console.log('');
      process.exit(0);
    });

    return;
  }

  const cmd = `npm run ${chosen.script}`;
  const child = spawn(cmd, {
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });

  child.on('exit', (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
