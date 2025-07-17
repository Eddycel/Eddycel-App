self.addEventListener('install', e => {
  console.log('Service Worker instalado');
});

self.addEventListener('fetch', e => {
  // Puedes interceptar o cachear aquí si quieres
});
