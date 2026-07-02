import { defineConfig } from 'vite'
import { resolve, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync, createReadStream, stat } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const assetsPath = resolve(__dirname, 'src/assets')

const MIME = {
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

// В dev отдаём src/assets по /assets
function serveAssetsPlugin() {
  return {
    name: 'serve-src-assets',
    configureServer(server) {
      server.middlewares.use('/assets', (req, res, next) => {
        const pathname = req.url?.split('?')[0] || '/'
        const file = resolve(assetsPath, pathname.replace(/^\//, ''))
        if (!file.startsWith(assetsPath)) return next()
        stat(file, (err, statResult) => {
          if (err || !statResult.isFile()) return next()
          const ext = extname(file)
          res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
          createReadStream(file).pipe(res)
        })
      })
    },
  }
}

// В dev не подключаем скрипт Telegram WebApp, чтобы не ходить в telegram.org при отладке
function stripTelegramScriptInDevPlugin() {
  return {
    name: 'strip-telegram-script-dev',
    transformIndexHtml(html, ctx) {
      if (!ctx.server) return html
      return html.replace(/\s*<script src="https:\/\/telegram\.org\/js\/telegram-web-app\.js"><\/script>/, '')
    },
  }
}

// Копируем src/assets в dist при сборке
function copyAssetsPlugin() {
  return {
    name: 'copy-assets',
    closeBundle() {
      const outDir = resolve(__dirname, 'dist', 'assets')
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
      function copyDir(src, dest) {
        if (!existsSync(dest)) mkdirSync(dest, { recursive: true })
        for (const name of readdirSync(src)) {
          const srcPath = resolve(src, name)
          const destPath = resolve(dest, name)
          if (statSync(srcPath).isDirectory()) copyDir(srcPath, destPath)
          else copyFileSync(srcPath, destPath)
        }
      }
      copyDir(assetsPath, outDir)
    },
  }
}

export default defineConfig({
  root: __dirname,
  base: './',
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
  server: {
    port: 8000,
  },
  plugins: [serveAssetsPlugin(), copyAssetsPlugin(), stripTelegramScriptInDevPlugin()],
})
