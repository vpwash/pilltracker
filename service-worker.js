// service-worker.js
const CACHE_NAME = 'pilltracker-cache-v1'
const assets = [
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/public/Pilltracker.png',
  // Add other assets as needed
]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(assets)))
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      } else {
        return fetch(event.request)
      }
    })
  )
})
