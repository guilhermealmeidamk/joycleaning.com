import { defineConfig }  from 'vite'
import tailwindcss       from '@tailwindcss/vite'
import { resolve, dirname } from 'path'
import { readFileSync }  from 'fs'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── HTML Partials plugin ──────────────────────────────────────────────────────
// Syntax: <!-- @include "src/partials/_header.html" -->
function htmlPartials() {
  const partialParents = new Map()

  function inject(html, currentFile) {
    return html.replace(/<!--\s*@include\s+"([^"]+)"\s*-->/g, (_, partial) => {
      const abs = resolve(dirname(currentFile), partial)
      if (!partialParents.has(abs)) partialParents.set(abs, new Set())
      partialParents.get(abs).add(currentFile)
      try {
        return inject(readFileSync(abs, 'utf-8'), abs)
      } catch {
        return `<!-- ERROR: "${partial}" not found -->`
      }
    })
  }

  return {
    name: 'html-partials',

    configureServer(server) {
      server.watcher.on('change', (file) => {
        const norm = file.replace(/\\/g, '/')
        for (const [partial, parents] of partialParents) {
          if (partial.replace(/\\/g, '/') === norm) {
            parents.forEach(p => {
              server.moduleGraph.getModulesByFile(p)
                ?.forEach(m => server.moduleGraph.invalidateModule(m))
            })
            server.ws.send({ type: 'full-reload' })
            break
          }
        }
      })
    },

    transformIndexHtml: {
      order: 'pre',
      handler: (html, ctx) => inject(html, ctx.filename),
    },
  }
}

export default defineConfig({
  plugins: [tailwindcss(), htmlPartials()],
  build: {
    rollupOptions: {
      input: {
        main:      resolve(__dirname, 'index.html'),
        workWithUs: resolve(__dirname, 'work-with-us.html'),
        giftCard:  resolve(__dirname, 'gift-card.html'),
      },
    },
  },
})
