# Appleby browser host 之死与抢救

## 场景

Appleby 的 browser_* 工具突然全部报错（`browser host closed stdout` / `Page.goto: Target page ... has been closed`），包括新开的 headless 实例也起不来。以及：headless run 中途死亡，console 刚读到手的大文本没落盘。

## 验证环境

2026-10-15，Windows，Appleby 安装包版。当日主会话与代理实例各死一次，均恢复。

## 方法

### 1. 判断死因：单实例占用

Appleby 的 browser host 是**单实例资源**——另一个 appleby 实例（TUI 或 headless）占着浏览器时，新实例的 browser host 起不来或死亡。

```bash
ps aux | grep -i appleby | grep -v grep   # 查残留实例
ps aux | grep -iE "chromium|browser_host" | grep -v grep
```

有残留 → 等它结束/让用户关掉/确认占用者，再重试。没有残留仍死 → 重开新 run（偶发死亡，第二次就好，当日两次均如此）。

### 2. 启动代理前先清场

启动浏览器代理实例前，确认没有别的 appleby 在跑（包括用户自己开的 TUI）。任务串行，不并行开两个带 browser 的实例。

### 3. 抢救 context.jsonl 里的大文本

run 死了但 console 读到的全文已经进了 run 的 `context.jsonl`（role=tool 消息，`content[0].text` 是内层 JSON：`{"result":{"n":总长,"t":"全文"}}`）。当日用此法救回 6.4MB Ross 亚里士多德全本：

```python
import json, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
for ln in open('<run>/context.jsonl', encoding='utf-8'):
    try: d = json.loads(ln)
    except: continue
    if d.get('role') != 'tool': continue
    for it in d.get('content', []):
        t = it.get('text', '')
        if len(t) > 1000000:          # 只看大的
            body = json.loads(t)['result']['t']
            body = body.encode('utf-8', 'replace').decode('utf-8')  # 去 surrogate
            io.open('recovered.txt', 'w', encoding='utf-8').write(body)
```

坑：t 里有 surrogate 字符，直接写文件报 `UnicodeEncodeError: surrogates not allowed`——必须先 `encode('utf-8','replace')` 再 decode。

### 4. 续跑

中断的任务用新任务书开新 run（幂等：已下载的文件跳过），或 `appleby <run目录> --task-file <续传任务>` 继续原 run。

## 失败清单

| 尝试 | 结果 | 原因 |
|---|---|---|
| 死后立即重试同 run | 再死 | 占用者还在 |
| 主会话与代理实例并行用 browser | 代理死 | 单实例冲突（用户确认根因） |
| 直接写 recovered 文本 | UnicodeEncodeError | surrogate 字符未清洗 |

## 适用边界

- `browser host closed stdout` 在确认无占用后仍复现多次，才是 Appleby 运行时 bug，去 Appleby 项目报；单次死亡按本流程处理即可。
- context.jsonl 抢救只对 console 返回的文本有效；fetch 的二进制（PDF）没进消息流，救不回。
