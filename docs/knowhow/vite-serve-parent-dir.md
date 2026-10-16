# Vite dev/build 都要服务项目根的其他目录（如 ../data）

## 场景

前端在子目录（`frontend/`），数据在项目根的兄弟目录（`data/`）。要求：dev 时 `fetch('/data/...')` 能取到，`vite build` 产物目录被**任何**静态服务器托管时也能取到（不做 file:// 双击、不引入后端）。

## 验证环境与日期

Windows 11 + Git Bash；vite 8.3.4 / typescript 7.0.2 / d3 7.9.0；2026-10-16。

## 方法

自定义 vite 插件，dev 与 build 各一段，放 `vite.config.ts`：

```ts
import { defineConfig, type Plugin } from 'vite';
import { cpSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const dataRoot = resolve(dir, '..', 'data');

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
          res.setHeader('Content-Type', 'application/json');
          res.end(readFileSync(file));
        },
      });
    },
    closeBundle() {
      const dist = resolve(dir, 'dist');
      rmSync(resolve(dist, 'data'), { recursive: true, force: true });
      cpSync(dataRoot, resolve(dist, 'data'), { recursive: true });
    },
  };
}

export default defineConfig({ publicDir: false, plugins: [dataDir()] });
```

前端代码统一 `fetch('/data/<demo>/xxx.jsonl')`，dev 与 dist 行为一致。build 后 `cd frontend/dist && python -m http.server 5200` 即可打开。

## 失败清单

| 尝试 | 结果 | 原因 |
|---|---|---|
| 前端 fetch 相对路径 `../data/...` | 返回 index.html（200 但内容是 HTML），JSON.parse 炸 | vite dev 只服务 root（frontend/），root 外路径走 SPA fallback |
| vite `server.fs.allow: ['..']` + 相对路径 fetch | 仍然 fallback 到 index.html | `fs.allow` 只放宽**模块导入**的安全边界，不改变静态中间件的文件查找根 |
| `resolve.alias: {'/data': '../data'}` | fetch 不走 alias | alias 只作用于 import/specifier 解析，不作用于运行时 fetch |
| `publicDir: '../data'` | 会把 data 复制进 dev 服务的 `/`，且 build 时混入产物结构 | 语义是"额外静态根"，路径不可控，放弃 |

## 适用边界

- 数据文件要被**编辑后立即在 dev 里可见**（每次请求现读，符合）。
- 若 data 目录巨大或含非静态资产，改用符号链接/仓库外部署再评估；本方案假设 data 是纯静态小文件。
- `route: '/data'` 是 connect 中间件的前缀匹配，`req.url` 在该层是去掉前缀后的剩余路径（各版本行为有差异，已按 vite 8 实测写死）。
