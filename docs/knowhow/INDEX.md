# KNOWHOW 索引

## 第一部分：给没有上下文的执行者（先读这）

你（人或 LLM）现在遇到了一个技术问题，这里存着之前踩坑验证过的解法。**按下面步骤用，不要通读全部文件。**

**第 1 步：用「问题特征」在下表找条目，不看域分组。**

| 你的情况（问题特征） | 去读 | 那篇会给你什么 |
|---|---|---|
| 要下载的网站 curl 超时/封锁，但浏览器能打开 | [archive-org-via-appleby-browser.md](archive-org-via-appleby-browser.md) | 用 headless appleby 实例当浏览器代理的完整配方 |
| 想用 AI 实例自动干活，不知道 appleby 怎么启动/监控/读结果 | [appleby-headless-automation.md](appleby-headless-automation.md)（入口篇，先读） | 文档位置、启动命令、run 监控、context.jsonl 提取 |
| appleby 的 browser 工具报 host closed / 实例起不来 | [appleby-browser-single-instance.md](appleby-browser-single-instance.md) | 死因判断（单实例占用）、context.jsonl 抢救大文本 |
| 大文件下载总在几 MB 处断 | [pdf-large-file-resume.md](pdf-large-file-resume.md) | Range 循环续传，拼到 %%EOF 与精确长度 |
| 知道 GitHub 仓库有文件，raw 链接下不了 | [github-raw-blocked.md](github-raw-blocked.md) | 三条下载路径 + 「书名原语言词」搜仓库法 |
| PDF 完好但 pdftotext 只出几百字节 | [scanned-pdf-no-text-layer.md](scanned-pdf-no-text-layer.md) | 无文字层判定法 + 四级对策（djvu.txt→换条目→电子化版→待OCR） |
| 脚本报成功但文件 0 字节/文件名被截断（Windows） | [windows-filename-silent-fail.md](windows-filename-silent-fail.md) | 文件名白名单 + 全量体检，信任落盘结果不信 stdout |

**第 2 步：按那篇的方法做。方法节里的命令可以直接照抄，只有路径/参数需要替换。**

**第 3 步：如果照做仍失败，读那篇的「失败清单」和「适用边界」——确认你的情况没有踩已知的坑；若确认是新的失败模式，解决后把它追加进该篇的失败清单（见第二部分）。**

**第 4 步：如果你的问题不在表里，这里没有答案。去 docs/QA 查当日流水，或用搜索引擎（有效词法见 github-raw-blocked.md 的搜索节）。**

---

## 第二部分：维护规则（写给记录者）

**什么需要记（满足任一即写）：**
- 一件事尝试 ≥3 次才成功——排除路径本身就是价值
- 发现新的可用工具/通道（如「appleby 可以当浏览器代理」「gh-proxy 可用」）
- 一个反直觉的坑（如「Windows 非法文件名静默失败」「扫描件 PDF 提不出字」）

**什么时候写：成功后立即写（AGENT.md Work Mode 第 5.5 步），不等会话结束。失败细节靠记忆补写必然失真。**

**一篇的结构（固定五节，顺序不可换）：**
1. **场景**——问题特征一句话，必须让没上下文的人对上号（第一部分表格直接引用这句）
2. **验证环境与日期**——什么机器/什么工具版本/哪天验证的；过时与否靠这节判断
3. **方法**——可照抄的命令/代码/流程，直接能跑
4. **失败清单**——试过什么、为何失败；表格形式（尝试/结果/原因）
5. **适用边界**——什么情况下本方法不适用，指到替代方案

**索引维护：新篇写完，在第一部分表格加一行（「你的情况」列用问题特征描述，不用域术语）；失效条目在行尾标 `[已失效 YYYY-MM-DD 原因]` 不删除。**

**分层原则（同工具多篇时）：入口篇（怎么学会用这个工具）→ 故障篇（工具坏了怎么办）→ 应用篇（用它干具体事）。应用篇开头指回入口篇。**
