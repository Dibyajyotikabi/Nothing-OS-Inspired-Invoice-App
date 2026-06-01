import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, 'src'), { recursive: true });

await Promise.all([
  cp(join(root, 'index.html'), join(dist, 'index.html')),
  cp(join(root, 'manifest.json'), join(dist, 'manifest.json')),
  cp(join(root, 'src', 'main.js'), join(dist, 'src', 'main.js')),
  cp(join(root, 'src', 'styles.css'), join(dist, 'src', 'styles.css'))
]);

console.log('Built extension files in dist/');
