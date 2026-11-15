// Service Worker for KJIT Classroom PWA
// Provides offline support for faculty review and cached static assets

const STATIC_CACHE = 'kjit-static-v1'
const API_CACHE = 'kjit-api-v1'

// Critical static assets to cache on install
const CRITICAL_ASSETS = [
  '/',
  '/manifest.json',
  '/KJU_Logo.webp',
  '/KJU_Banner.png',
]

// Install: cache critical static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(CRITICAL_ASSETS)
    })
  )
})

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      )
    })
  )
})

// Fetch: network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET requests over http(s)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return
  }

  // Skip browser extension requests
  if (url.protocol.startsWith('chrome-extension:')) {
    return
  }

  // API requests: network first, cache fallback
  // This is critical for offline faculty review
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Fall back to cached response
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // No cache available - return offline error
            return new Response(
              JSON.stringify({ error: 'offline', message: 'No internet connection and no cached data available' }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            )
          })
        })
    )
    return
  }

  // Static assets: cache first, then network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }
      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response.ok) {
          return response
        }
        const responseClone = response.clone()
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(request, responseClone)
        })
        return response
      })
    })
  )
})
