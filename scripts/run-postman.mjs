// Menjalankan Postman Collection dengan newman. baseUrl otomatis mengikuti PORT di .env
// (bisa ditimpa dengan BASE_URL). Pakai: npm run test:postman
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');
const baseUrl = process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
console.log(`Menjalankan collection ke ${baseUrl}`);

const result = spawnSync(
  'npx',
  ['--yes', 'newman', 'run', 'postman/ecommerce.postman_collection.json', '--env-var', `baseUrl=${baseUrl}`],
  { stdio: 'inherit', shell: true },
);
process.exit(result.status ?? 1);
