import { defineConfig, type Plugin } from 'vite';
import { cpSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataRoot = resolve(__dirname, '..', 'data');

// /data → 项目根 data/：
// - dev：中间件读文件响应（纯静态，无后端逻辑）
// - build：把 data/ 复制进 dist/data，dist 任何静态服务器可整体托管
function dataDir(): Plugin {
  return {
    name: 'serve-project-data',
    configureServer(server) {
      server.middlewares.stack.unshift({
        route: '/data',
        handle: (req: any, res: any, next: any) => {
          const rel = decodeURIComponent((req.url || '').replace(/^\//, '')).replace(/\\/g, '/');
          const file = resolve(dataRoot, rel);
          if (!file.startsWith(dataRoot) || !existsSync(file) || !file.endsWith('.jsonl')) return next();
          try {
            res.setHeader('Content-Type', 'application/json');
            res.end(readFileSync(file));
          } catch (e) {
            next(e);
          }
        },
      });
    },
    closeBundle() {
      const dist = resolve(__dirname, 'dist');
      rmSync(resolve(dist, 'data'), { recursive: true, force: true });
      cpSync(dataRoot, resolve(dist, 'data'), { recursive: true });
    },
  };
}

export default defineConfig({
  publicDir: false,
  plugins: [dataDir()],
});
