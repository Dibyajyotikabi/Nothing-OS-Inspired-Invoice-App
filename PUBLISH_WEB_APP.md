# Publish The Web App For Free

This project is ready for GitHub Pages. It publishes only the static web app from:

```text
Simple Invoice iPhone App/app
```

It does not publish the native Xcode project.

## Why This Is The Safe Free Option

- Free for public repositories on GitHub Free.
- Uses HTTPS on `github.io`.
- Static files only: HTML, CSS, JavaScript, images, manifest, and service worker.
- No backend, database, API keys, or server-side invoice storage.
- Invoice data is saved in the browser's local storage on each device.
- Search engines are asked not to index the app with `robots.txt`.

## Publish Steps

1. Push this repository to GitHub.

2. Open the repository on GitHub:

   ```text
   https://github.com/Dibyajyotikabi/Nothing-OS-Inspired-Invoice-App
   ```

3. Go to Settings, Pages.

4. Under Build and deployment, set Source to GitHub Actions.

5. Open Actions, run or wait for:

   ```text
   Deploy Simple Invoice Web App
   ```

6. Your app URL should be:

   ```text
   https://dibyajyotikabi.github.io/Nothing-OS-Inspired-Invoice-App/
   ```

## iPhone Install

Open the URL in Safari on iPhone, then tap Share, Add to Home Screen, and Add.

After the first load, the service worker caches the app shell so it can keep opening like a web app. Invoice data stays in that browser/app storage on the phone.

## Refresh The Published App

After changing the root app, rebuild the publish folder:

```bash
cd "Simple Invoice iPhone App"
./scripts/build-iphone-web-app.sh
```

Then commit and push the updated files.
