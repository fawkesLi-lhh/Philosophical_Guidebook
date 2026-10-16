# 用 Appleby 实例做浏览器代理（打通 curl 封锁域）

## 场景

目标站点（archive.org、wikisource.org、marxists.org、proletarian.me、raw.githubusercontent.com）在本机 curl 全部 000 超时，但 Appleby 托管 Chromium 走的网络路径可达。需要下载这些域上的文件。

## 验证环境

2026-10-15，Windows，Appleby 安装包版（%LOCALAPPDATA%\Appleby），headless 模式，gpt5 api。当日用此法下载 20+ 本书（麦克斯韦/伽利略/库恩/哥德尔 CW/胡塞尔/海德格尔/萨特/卡尔纳普/维纳/德里达/阿尔都塞/列宁哲学笔记/启蒙辩证法/维特根斯坦哲学研究/罗素 Ross 亚里士多德全本等）。

## 方法

### 1. 启动（PowerShell 分离，不占当前终端）

```powershell
# 任务文件先写到 %TEMP%\dl_taskN.md；工作目录用独立 test workspace（不污染项目 .appleby）
powershell -NoProfile -Command "Start-Process -WindowStyle Hidden -FilePath \"$env:LOCALAPPDATA\Appleby\appleby.exe\" -ArgumentList '--api','<api名>','--task-file','C:\...\Temp\dl_taskN.md','--tools','Bash,Read,Write,browser_navigate,browser_snapshot,browser_interact,browser_console' -WorkingDirectory 'C:\...\Temp\gpt5test' -RedirectStandardOutput '<项目>\logs\cu_runN.log' -RedirectStandardError '<项目>\logs\cu_runN.err'"
```

### 2. 任务书模板（每条都是血泪）

```markdown
你是下载操作员。只用 browser_* 工具，不要 computer_*。
【第一条，必须放最前面】archive.org 在本机 curl 是封锁的（永远超时）。上一次任务全败就是因为用了 curl。所有对该域的访问必须通过 browser_navigate。

方法（已验证）：
1. browser_navigate https://archive.org/advancedsearch.php?q=<查询>&fl%5B%5D=identifier&rows=10&output=json
2. browser_console: document.body.innerText → 解析 JSON 拿 identifier
3. browser_navigate https://archive.org/metadata/<identifier> → console 读 → files[] 找 name 含 _djvu.txt 的
4. browser_navigate https://archive.org/download/<identifier>/<URL编码文件名> → console 分段读 innerText（大文件 slice）→ Bash/Write 落盘

每完成一项往 <项目>/logs/cu_resultN.md 追加一行（成功/失败+identifier+路径）。结束写 DONE。
目标清单：…（≤12 项/任务书）
```

### 3. 监控

- 轮询 `grep -c "" <run目录>/context.jsonl`（在 test workspace 的 .appleby/runs/ 下），两次不变 = 卡死。
- 结果文件 logs/cu_resultN.md 逐行增长 = 正常推进。

## 失败清单（试过什么、为何不行）

| 尝试 | 结果 | 原因 |
|---|---|---|
| computer_* 全套（截屏+鼠标点击） | 5 任务全败 | 物理桌面有日历弹窗+其他窗口，鼠标坐标不可靠 |
| 任务书只写「用浏览器」不禁止 curl | 全败 | 模型偷懒先用 curl 试，封锁域超时后直接放弃 |
| 猜 _djvu.txt 文件名（<identifier>_djvu.txt） | 失败 | 真实文件名常含书名+复杂后缀，必须 metadata API 拿 |
| 主会话直接用 browser_* | 一度可用后死亡 | browser host 单实例，见 appleby-browser-single-instance.md |

## 适用边界

- 只对「浏览器可达但 curl 封锁」的域有意义；curl 通的域直接 curl 更快。
- 下载纯文本（djvu.txt/html/json）最稳；PDF 需 fetch+blob 或另存对话框，复杂得多。
- 401 = 借阅锁（无账号不可下）；403 = 地区/条目限制；两者都换 identifier 再试，常有其他上传件。
