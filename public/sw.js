// 倾听小猫 PWA Service Worker
const CACHE_NAME = 'qingting-cat-v1';
const OFFLINE_URL = '/';

// 需要缓存的核心资源
const CORE_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico'
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker 安装中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 缓存核心资源');
        return cache.addAll(CORE_CACHE_URLS);
      })
      .then(() => {
        console.log('✅ Service Worker 安装完成');
        // 强制激活新的 service worker
        return self.skipWaiting();
      })
  );
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker 激活中...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ 删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker 激活完成');
        // 立即控制所有客户端
        return self.clients.claim();
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  // 只处理同源请求
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // 对于导航请求（页面访问），使用 Network First 策略
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 如果网络请求成功，缓存响应
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // 网络失败时，尝试从缓存获取
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // 如果缓存中也没有，返回离线页面
              return caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }

  // 对于其他资源，使用 Cache First 策略
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then((response) => {
            // 只缓存成功的 GET 请求
            if (response.status === 200 && event.request.method === 'GET') {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
            }
            return response;
          });
      })
  );
});

// 处理推送通知（未来可扩展）
self.addEventListener('push', (event) => {
  console.log('📱 收到推送消息');
  // 这里可以添加推送通知的处理逻辑
});

// 处理通知点击事件
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 通知被点击');
  event.notification.close();
  
  // 打开或聚焦到应用
  event.waitUntil(
    clients.openWindow('/')
  );
});
