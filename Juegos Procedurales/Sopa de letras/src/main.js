import { GameController } from './core/GameController.js';

window.addEventListener('DOMContentLoaded', async () => {
  const controller = new GameController(document, window);

  try {
    await controller.init();
  } catch (error) {
    console.error('No se pudo iniciar la app.', error);
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch((error) => {
      console.warn('No se pudo registrar el service worker.', error);
    });
  });
}
