import { mkdir, readdir, readFile, rm, stat, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageDir = resolve(scriptDir, '..');
const projectRoot = resolve(packageDir, '..');
const appDir = join(packageDir, 'app');

await rm(appDir, { recursive: true, force: true });
await mkdir(join(appDir, 'src'), { recursive: true });
await mkdir(join(appDir, 'assets'), { recursive: true });
await mkdir(join(appDir, 'icons'), { recursive: true });

await copyFile(join(projectRoot, 'src/main.js'), join(appDir, 'src/main.js'));
await copyFile(join(projectRoot, 'src/styles.css'), join(appDir, 'src/styles.css'));
await copyDirectory(join(projectRoot, 'assets'), join(appDir, 'assets'));

const rootIndex = await readFile(join(projectRoot, 'index.html'), 'utf8');
const appIndex = rootIndex
  .replace('<title>Dot Matrix Invoice App</title>', '<title>Simple Invoice</title>')
  .replace(
    '    <link rel="icon" href="data:," />',
    `    <meta name="theme-color" content="#ececea" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="Simple Invoice" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <link rel="manifest" href="manifest.webmanifest" />
    <link rel="apple-touch-icon" href="icons/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png" />`
  )
  .replace(
    '    <script src="src/main.js"></script>\n  </body>',
    '    <script src="src/main.js"></script>\n    <script src="src/iphone-install.js"></script>\n  </body>'
  );

await writeFile(join(appDir, 'index.html'), appIndex);

await writeFile(
  join(appDir, 'manifest.webmanifest'),
  JSON.stringify(
    {
      name: 'Simple Invoice',
      short_name: 'Invoice',
      description: 'Editable invoice app for iPhone.',
      start_url: './index.html',
      scope: './',
      display: 'standalone',
      orientation: 'any',
      background_color: '#ececea',
      theme_color: '#ececea',
      categories: ['finance', 'productivity', 'business'],
      icons: [
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' }
      ]
    },
    null,
    2
  )
);

await writeFile(
  join(appDir, 'src/iphone-install.js'),
  `(() => {
  const canRegisterServiceWorker = 'serviceWorker' in navigator && window.isSecureContext;

  if (canRegisterServiceWorker) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch((error) => {
        console.info('Simple Invoice offline cache is unavailable:', error);
      });
    });
  }
})();\n`
);

const cachedFiles = [
  './',
  './index.html',
  './privacy.html',
  './robots.txt',
  './manifest.webmanifest',
  './src/main.js',
  './src/styles.css',
  './src/iphone-install.js',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

for (const file of await listFiles(join(appDir, 'assets'))) {
  cachedFiles.push(`./${relative(appDir, file).replaceAll('\\', '/')}`);
}

await writeFile(
  join(appDir, 'service-worker.js'),
  `const CACHE_NAME = 'simple-invoice-iphone-v2';
const APP_SHELL = ${JSON.stringify(cachedFiles, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
          }
          return networkResponse;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});\n`
);

await writeFile(join(appDir, '.nojekyll'), '');
await writeFile(
  join(appDir, 'robots.txt'),
  `User-agent: *
Disallow: /\n`
);
await writeFile(
  join(appDir, 'privacy.html'),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Simple Invoice Privacy</title>
    <link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png" />
    <style>
      body {
        max-width: 720px;
        margin: 0 auto;
        padding: 32px 18px;
        color: #111;
        background: #f7f7f4;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.6;
      }

      h1 {
        margin: 0 0 14px;
        font-size: 30px;
      }

      p {
        margin: 0 0 12px;
      }

      a {
        color: inherit;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Simple Invoice Privacy</h1>
      <p>Simple Invoice is a static web app. It does not include a backend server, analytics, ads, payment processing, or third-party API calls.</p>
      <p>Invoice details you type into the app are stored in your browser's local storage on that device. They are not uploaded by this app.</p>
      <p>If you clear browser data, remove the Home Screen web app, or use a different browser/device, locally saved invoice data may not be available there.</p>
      <p><a href="./">Back to Simple Invoice</a></p>
    </main>
  </body>
</html>\n`
);

console.log(`Built ${appDir}`);

async function copyDirectory(source, destination) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const sourcePath = join(source, entry.name);
    const destinationPath = join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      await copyFile(sourcePath, destinationPath);
    }
  }
}

async function listFiles(directory) {
  const exists = await stat(directory).then(() => true).catch(() => false);
  if (!exists) {
    return [];
  }

  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}
