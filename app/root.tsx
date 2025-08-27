import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { initDatabase } from "~/lib/db.server";
import Header from "~/components/Header";

import "./tailwind.css";

// 确保在服务器启动时初始化数据库
let dbInitialized = false;

export async function loader({ request }: LoaderFunctionArgs) {
  if (!dbInitialized) {
    try {
      await initDatabase();
      dbInitialized = true;
      console.log("数据库初始化成功");
    } catch (error) {
      console.error("数据库初始化失败:", error);
    }
  }
  return json({});
}

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  // PWA Manifest
  { rel: "manifest", href: "/manifest.json" },
  // Apple Touch Icons
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  // Favicon
  { rel: "icon", href: "/favicon.ico" },
  { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
  { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <script
          defer
          src="https://a.hweb.peterchen97.cn/script.js"
          data-website-id="f6af9655-6fa7-486a-ab80-8689989fe76e"
        ></script>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no"
        />

        {/* PWA Meta Tags */}
        <meta name="application-name" content="倾听小猫" />
        <meta
          name="description"
          content="帮你把不舒服的话变成暖心的表达，温暖有效的非暴力沟通助手"
        />
        <meta name="theme-color" content="#ffffff" />
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#1f2937"
          media="(prefers-color-scheme: dark)"
        />
        <meta name="color-scheme" content="light dark" />

        {/* iOS Safari PWA Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="倾听小猫" />
        <meta name="format-detection" content="telephone=no" />

        {/* Android Chrome PWA Support */}
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />

        {/* Service Worker 注册 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('✅ Service Worker 注册成功:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('❌ Service Worker 注册失败:', error);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}
