import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const configs = [
  [
    'server/.env',
    '.env.example',
    (text) =>
      text.replaceAll(
        'change-me-in-production-use-a-long-random-string',
        randomBytes(32).toString('hex'),
      ),
  ],
  ['mobile/.env', 'mobile/.env.example', (text) => text],
];

for (const [target, source, transform] of configs) {
  const destination = resolve(root, target);
  if (existsSync(destination)) {
    console.log(`Kept existing ${target}`);
    continue;
  }
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, transform(readFileSync(resolve(root, source), 'utf8')), {
    flag: 'wx',
    mode: 0o600,
  });
  console.log(`Created ${target}`);
}
console.log('Local configuration prepared. No services started or files overwritten.');
console.log('Next: follow README.md. Set reachable API and worker URLs for a physical phone.');
