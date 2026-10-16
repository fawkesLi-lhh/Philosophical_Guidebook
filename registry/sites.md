# 找书手册（权威）

目的：给定任意一本书，按本手册操作能最快拿到可进 texts/ 的文字版。站点状态与经验均来自 2026-10-15 语料工程实测（78 本 / 11.8 万段全流程验证）。过程细节与失败记录见 `docs/history/2026-10-15-corpus-acquisition-history.md`。

## 一、找书决策树（按 速度 × 成功率 排序，从上往下试）

```text
给定一本书
│
├─ 1. Gutenberg（curl 直下，最快）
│    公版英文书 + 少量原著语言（法/德/拉丁）
│    搜: https://www.gutenberg.org/ebooks/search/?query=<书名+作者>
│    下: https://www.gutenberg.org/cache/epub/<id>/pg<id>.txt
│    ↳ 404 时试 /files/<id>/<id>-h/<id>-h.htm 或 -images.html（math-heavy 书的 txt 是说明文件）
│
├─ 2. GitHub（curl 直下，公版电子化仓库）
│    api.github.com 搜仓库（用书名原语言词！搜 Begriffsschrift 命中，英文泛词不中）
│    列目录: https://api.github.com/repos/<o>/<r>/contents/<path>
│    下文件: https://github.com/<o>/<r>/raw/main/<path>（<3MB 可靠）
│    ↳ raw.githubusercontent.com 直连封锁；备用代理 https://gh-proxy.com/https://raw.githubusercontent.com/...
│    已知金矿: MARX-EBOOKS/marx-ebooks.github.io（MEW 德/MEGA/文集中文/列宁中文43卷）、MARX-EBOOKS/MLRAW（源文件）、cmsmcq/Frege-1879
│    ↳ 限额: 搜索 10 次/分钟，sleep 10 重试
│
├─ 3. 专业站（curl 直下，各领域）
│    wilbourhall.org   数学史（花拉子米/开普勒全集/哥白尼1543/牛顿…） /pdfs/ 直链
│    monoskop.org      理论·哲学文献 wiki /<人名> 页列 /images/ PDF（哥德尔CW/Tractatus 1922/海德格尔）
│    logicmuseum.com   中世纪逻辑（奥卡姆 拉英对照）
│    Perseus           古典原文（Bekker 编号） /hopper/text?doc=Perseus:text:1999.01.XXXX
│
├─ 4. archive.org（万能后备，走 Appleby 浏览器代理，见第二节）
│    公版扫描书 + 自动 OCR 文本(_djvu.txt)。版权书可能有借阅副本(401)。
│
└─ 5. 搜索引擎发现新站
     bing: https://www.bing.com/search?q=<词>&setlang=en&cc=US
     ↳ 中文词无效；英文书名精确短语次之；最有效 = 「已知站名+作者/原语言书名」
     baidu: 单次可用，很快触发安全验证
```

## 二、Appleby 浏览器代理（封锁域的唯一通道）

本机 curl 封锁域：archive.org、wikisource、marxists.org、proletarian.me、raw.githubusercontent。Appleby 托管 Chromium 走不同网络路径，可达。**做法：headless 起一个 appleby 实例当浏览器代理。**

### 启动命令

```powershell
# 任务文件先写到 %TEMP%\dl_taskN.md，工作目录用独立 test workspace（不污染项目 .appleby）
powershell -NoProfile -Command "Start-Process -WindowStyle Hidden -FilePath `$env:LOCALAPPDATA\Appleby\appleby.exe` -ArgumentList '--api','<api名>','--task-file','C:\...\Temp\dl_taskN.md','--tools','Bash,Read,Write,browser_navigate,browser_snapshot,browser_interact,browser_console' -WorkingDirectory 'C:\...\Temp\gpt5test' -RedirectStandardOutput '<项目>\logs\cu_runN.log' -RedirectStandardError '<项目>\logs\cu_runN.err'"
```

### 任务书模板要点（血泪经验，每条都踩过）

1. **开头第一句就写「只用 browser_*，禁止 curl 访问 archive.org（本机封锁，永远超时）」**——模型会偷懒用 curl 导致整批失败（task6 教训）。
2. **禁止 computer_***：物理桌面有弹窗/窗口干扰鼠标坐标，五个任务全败（task1 教训）。browser_* 不依赖桌面。
3. 给出验证过的三步法（见下），不要让模型自己发明路径。
4. **结果约定**：每完成一项向 `logs/cu_resultN.md` 追加一行（成功/失败+identifier+路径），主会话轮询该文件监控进度。
5. 一个任务书 ≤12 项目标；模型中断后用 `appleby <run目录> --task-file <续传任务>` 继续，或直接新 run。

### archive.org 三步法（已验证 20+ 次）

```text
1. 搜 identifier:
   browser_navigate https://archive.org/advancedsearch.php?q=<查询>&fl%5B%5D=identifier&rows=10&output=json
   browser_console: document.body.innerText   → 解析 JSON 拿 identifier 列表
2. 列真实文件名:
   browser_navigate https://archive.org/metadata/<identifier>
   console 读 → files[] 里找 name 含 _djvu.txt 的（自动 OCR 全文，大多公版条目都有）
3. 下载:
   browser_navigate https://archive.org/download/<identifier>/<URL编码文件名>
   console 分段读 document.body.innerText（大文件 slice）→ Bash/Write 落盘
```

- 401 = 借阅锁（需账号，无账号换 identifier 再试，往往有别的上传件）
- 403 = 地区/条目限制，换 identifier
- PDF 直链也可这样下，但优先 `_djvu.txt`（现成 OCR 文字，PDF 扫描件常常无文字层）

### 故障与抢救

- **browser host closed stdout / run 卡死**：appleby 浏览器是单实例（一个 host）——**其他 appleby 实例占用时会死**。排查：`ps aux | grep appleby`，确认无残留实例再启动；偶发死亡直接重开新 run。
- **run 中断、文本没落盘**：console 读到的大文本已进 `context.jsonl`（role=tool 消息 content[].text，内层是 `{"result":{"n":…,"t":"全文"}}`）。从 jsonl 抢救：解析每行，找 len>1e6 的 tool text，`json.loads` 后取 `result.t` 写盘（本方法救回 6.4MB Ross 亚里士多德全本）。
- **监控**：轮询 `grep -c "" run目录/context.jsonl` 看是否还在动；连查两次不变即卡死。

## 三、通用技术坑（Windows + 本机网络）

| 坑 | 症状 | 解法 |
|---|---|---|
| Windows 非法文件名字符（`:` 等） | 写入 0 字节但脚本打 OK | 文件名白名单：中文/字母/数字/圆点/连字符/下划线 |
| PDF 大文件传输截断 | pdftotext 报 xref 错 | Range 续传（`curl -r <start>-`）循环拼装，直到尾部 `%%EOF`；先 `curl -sI` 拿 Content-Length，超长时按精确长度截断（续传超范围会把错误 HTML 页拼进文件） |
| 单连接 ~100s 窗口 | 大文件每次只到 5MB | 多轮 Range 续传；脚本见 scripts/chunked_download.py |
| Google/Dover 扫描件 | PDF 只提出几百字节 | 无文字层：找同条目 `_djvu.txt`（archive.org 已 OCR），或留 sources 待 OCR |
| html 是 cp1252 编码 | utf-8 strict 读失败 | `io.open(..., encoding='cp1252', errors='replace')` |
| 控制台 GBK | python 打印 ä/ö 报错 | `sys.stdout = TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')` |
| raw.githubusercontent 封锁 | curl 000 | github.com/<repo>/raw/main/ 中转，或 gh-proxy.com |
| Gutenberg math 书 | txt 只有 3KB 说明 | 用 `-images.html` 或 PDF；PM/几何基础都这样 |
| Marx/Engels 著作 | Gutenberg 只有英译 | MARX-EBOOKS 的 MEW（德文原著分章 html）/MLRAW（列宁中文/文集中文） |

## 四、标准化入库（拿到文件后）

- 三个脚本：`scripts/standardize_gutenberg.py`（PG txt，剥头尾）/ `standardize_html.py`（html，cp1252 容错）/ `standardize_plaintext.py`（djvu.txt、pdftotext 产物）
- 命名：`texts/<成书年>-<哲学家>-<书名>.md`，BCE 为负数；文件名过白名单
- frontmatter 必填：philosopher / work / composed_year / language / source_url / paragraph_count；`diagram_source` 标注演化图来源
- 语言政策（QA A12 修订版）：**任意语言译本即可，原著语言优先**；二手文献（讲稿/百科/选集）frontmatter 标明身份
- 体检：段数与 frontmatter 一致、非零、无非法字符——收尾必跑

## 五、站点速查（当前状态 2026-10-15）

| 站点 | 通道 | 主打内容 |
|---|---|---|
| gutenberg.org | curl | 公版英译/少量原文 |
| api.github.com + github.com/raw | curl | 马恩列全集、电子化原著仓库 |
| wilbourhall.org | curl | 数学史 PDF |
| monoskop.org | curl | 哲学理论文献 |
| logicmuseum.com | curl | 中世纪逻辑 |
| perseus.tufts.edu | curl | 古典原文 |
| gh-proxy.com | curl | GitHub raw 代理 |
| archive.org | **appleby browser** | 万能后备（扫描+OCR） |
| proletarian.me | appleby browser | 中文左翼文献（未深挖） |
| marxists.org | appleby browser | 未深挖 |
| bing / baidu | curl | 发现新站（英文原词） |

失效或新增站点时更新本表与决策树。
