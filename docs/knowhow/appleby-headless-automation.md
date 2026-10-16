# 把 Appleby 当可编程代理用（headless 自动化速查）

## 场景

需要让一个 AI 实例去执行浏览器操作/文件操作/桌面操作等自动化任务（比如下载封锁域的文件、批量网页操作）。Appleby 本身就是现成的代理运行时——但**怎么启动、怎么配、怎么监控、去哪查文档**，不读它的文档是不知道的。本文是那条学习路径的沉淀。

## 验证环境

2026-10-15，Windows，Appleby 安装包版（`%LOCALAPPDATA%\Appleby\`）。当日用它做浏览器代理下载 30+ 本书。

## 方法

### 0. 文档在哪（知识源头，先记住）

```
安装包文档：%LOCALAPPDATA%\Appleby\resources\docs\
  appleby-user-guide.md          安装/配置/启动/TUI（headless 用法在 §3.2）
  appleby-structure-reference.md 目录结构/run 布局/工具表/browser host 架构
  appleby-extension-testing-quick-reference.md  测试工作区速查
源仓库文档（若有 checkout）：../Appleby/bundled/docs/ 同一套 + AGENT.md
```

任何「这工具到底支不支持 X」的问题，答案在这三个文件里，不要猜。

### 1. 先确认 api 配置

```bash
cat ~/.appleby/config.toml        # Windows: %USERPROFILE%\.appleby\config.toml
# 必须有 [apis.<名字>] 段：type + model + api_key + base_url
# default_api 指向其中一个
```

没配置就先跑一次 TUI 交互式首启（`appleby` 会进首启表单），或手工编辑 config.toml。

### 2. headless 启动（任务模式）

```bash
appleby --task "一句话任务"                          # 在当前/新建 run 上跑，答完打 stdout 退出
appleby --task-file 任务.md                          # 长任务用文件
appleby --api <apis里的名字> --task-file 任务.md      # 指定模型
appleby --tools "Bash,Read,Write,browser_navigate,browser_console" --task-file t.md
appleby <run目录或000003> --task-file 续传.md         # 继续指定 run
```

要点：
- `--task`/`--task-file` = headless（无 TUI）；不带则开 TUI。二者不能混 `--no-load-context`。
- `--tools` 是白名单（必须在 config 的 default_tool_set 范围内）——**给任务最小工具集**，顺手禁掉不想要的（如 computer_*）。
- 创建型参数（--api/--tools/--memory）只在新 run 时合法，续 run 时报错。

### 3. 分离启动（不占当前终端，PowerShell）

```powershell
powershell -NoProfile -Command "Start-Process -WindowStyle Hidden -FilePath \"$env:LOCALAPPDATA\Appleby\appleby.exe\" -ArgumentList '--api','<名>','--task-file','C:\...\t.md','--tools','Bash,Read,Write,browser_navigate,browser_console' -WorkingDirectory '<独立workspace>' -RedirectStandardOutput '<out.log>' -RedirectStandardError '<err.log>'"
```

- `-NoProfile` 必加（否则执行策略挡 profile.ps1）。
- 工作目录用独立 test workspace（/tmp/xxx），别污染项目 .appleby/。
- bash 里 `nohup ... &` 会被会话超时杀死；`setsid` 在 Git Bash 不存在——用 PowerShell Start-Process 才是真分离。

### 4. run 布局与监控

```
<工作目录>/.appleby/runs/00000N/
  context.jsonl    全部消息历史（append-only，权威）
  state_info.json  run 身份（api、tool_set、skills）
  skills/          本 run 的技能副本
```

监控进度：`grep -c "" context.jsonl`（行数增长=在干活；两次不变=卡死）。
stdout 日志（RedirectStandardOutput 的文件）只有最终回答，过程细节都在 context.jsonl。

### 5. 读 context.jsonl 提取结果

```python
import json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
for ln in open('<run>/context.jsonl', encoding='utf-8'):
    try: d = json.loads(ln)
    except: continue
    role = d.get('role')          # user / assistant / tool
    for it in d.get('content', []):
        if it.get('type') == 'tool_use':
            print('TOOL:', it.get('name'))
        elif it.get('type') == 'text':
            print('TEXT:', it.get('text','')[:100])
        elif it.get('type') == 'tool_result':
            print('RESULT:', str(it.get('content'))[:100])
```

- 嵌套坑：tool_result 的 content 可能是 list，text 在里面；console 返回的 JSON 再包一层（`{"result":{...}}`）。
- surrogate 坑：写文件前 `body.encode('utf-8','replace').decode('utf-8')`。
- 代理模型死了但文本已进 jsonl——直接抢救，见 appleby-browser-single-instance.md。

### 6. 工具能力速记（详细表在 structure-reference）

| 工具 | 用途 | 陷阱 |
|---|---|---|
| Bash/Read/Write/Edit | 文件操作 | 同普通会话 |
| browser_navigate/snapshot/interact/console/dialog/cdp | 托管 Chromium | 单实例！别的 appleby 占用时死 |
| computer_screenshot/mouse/keyboard | 真实桌面 | 需要干净桌面，弹窗/窗口干扰坐标 |
| memory_* | 索引器桶查询 | 需 --memory 声明 |
| Skill | 技能包 | run 创建时拷贝 |

### 7. 任务书写作要点（喂给代理实例的）

- 第一条写清「什么工具禁止、什么必须用」（代理模型会偷懒走捷径，如用 curl 撞封锁域）。
- 给出已验证的方法步骤，别让它自己发明路径。
- 约定结果文件（逐项追加一行），主会话轮询监控。
- 每任务 ≤12 项目标；中断后新任务书续跑（幂等跳过已完成）。

## 失败清单

| 尝试 | 结果 | 原因 |
|---|---|---|
| bash nohup 后台跑 appleby | 超时被杀 | bash 会话超时连带子进程 |
| cmd start //b 分离 | 路径/变量展开错乱 | cmd 转义地狱 |
| PowerShell 不带 -NoProfile | 卡在执行策略 | profile.ps1 被策略挡 |
| --task 与 --no-load-context 同用 | 直接报错 | 文档明确禁止 |
| 续 run 时再传 --api | 报错 | 创建参数仅新 run 合法 |

## 适用边界

- Appleby 是闭源安装包：文档以 `%LOCALAPPDATA%\Appleby\resources\docs\` 为准，源仓库文档需有 checkout。
- headless 单轮任务最稳；长任务靠任务书拆段 + 续跑。
- browser 工具受单实例限制；computer 工具需要无人干扰的桌面。
