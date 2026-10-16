# raw.githubusercontent 封锁的中转与 GitHub 找书法

## 场景

1. 知道 GitHub 仓库里有要的文件，但 `raw.githubusercontent.com` 直连 000（封锁）。
2. 想在 GitHub 上找某本书的电子化仓库，不知道仓库名。

## 验证环境

2026-10-15，Windows。当日经此法拿到：香农 1948 全文（spinchange 仓库）、弗雷格 Begriffsschrift TEI 全本（cmsmcq/Frege-1879）、MARX-EBOOKS 的 MEW3/MEGA II-5/费尔巴哈提纲/列宁中文 43 卷。

## 方法

### 1. 三条下载路径（按优先级）

```bash
# A. github.com 中转（最稳，单文件 <3MB 可直接成功）
https://github.com/<owner>/<repo>/raw/main/<path>        # 默认分支 main，旧仓库 master

# B. gh-proxy 代理（A 失败时）
https://gh-proxy.com/https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>

# C. api.github.com contents 接口（列目录 + 小文件 base64）
https://api.github.com/repos/<owner>/<repo>/contents/<path>
```

### 2. 搜索仓库：用书名「原语言词」，不用英文描述词

当日对照实验：
- `Begriffsschrift`（德文原词）→ 直接命中 cmsmcq/Frege-1879（TEI 全本电子化）
- `godel 1931 undecidable`（英文泛词）→ 全是教材/证明库，无原文

工具：`api.github.com/search/repositories?q=<词>`，或直接用 github-research skill 的脚本（封装好了限速处理）。

### 3. 已知金矿清单（哲学·马列方向）

- `MARX-EBOOKS/marx-ebooks.github.io`：MEW 德文全集分章 html、MEGA II、马恩文集中文、列宁全集中文
- `MARX-EBOOKS/MLRAW`：上述的源文件仓库（lenin_pages 列宁 43 卷中文、MEA_raw 文集中文）
- `cmsmcq/Frege-1879`：Begriffsschrift 1879 TEI XML 全本
- `spinchange/the-mathematical-theory-of-communication`：香农 1948 md 全文

### 4. 限额

GitHub API 匿名搜索 10 次/分钟，触发后 sleep 10–15 秒重试；api.github.com 的 contents 接口限额更宽。

## 失败清单

| 尝试 | 结果 | 原因 |
|---|---|---|
| raw.githubusercontent 直连 | 000 | 封锁 |
| github.com/<repo>/raw 大文件（>3MB） | 302 到封锁域后断 | 中转只对小文件稳 |
| html 搜索结果页 grep | 拿不到 | GitHub 搜索结果页是 JS 渲染，curl 抓到的是壳 → 必须用 api.github.com |
| git clone 大仓库 | 没试 | 无 git 配置时不可用；api 逐文件已够 |

## 适用边界

- 文件 >3MB 时 A 路径不稳，直接上 gh-proxy（B）。
- GitHub 上的「电子化原著」质量参差（TEI/扫描/文本版），拿到的先验证内容再入库。
