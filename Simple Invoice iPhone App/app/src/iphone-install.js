(() => {
  const canRegisterServiceWorker = 'serviceWorker' in navigator && window.isSecureContext;

  if (canRegisterServiceWorker) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch((error) => {
        console.info('Simple Invoice offline cache is unavailable:', error);
      });
    });
  }
})();
