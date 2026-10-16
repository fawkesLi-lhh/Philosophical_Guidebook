# 大 PDF 分块续传（~100s 单连接窗口）

## 场景

下载 20–46MB 的 PDF，单次连接约 100 秒后断开，每次只拿到 3–5MB。直接 `-C -` 重试曾把文件搞坏（体积反而变小或尾部混入错误页）。

## 验证环境

2026-10-15，Windows，目标 wilbourhall.org / monoskop.org / archive.org 的 20–46MB PDF（花拉子米 26.8MB、哥白尼 1543 31.5MB、开普勒 GW III 46MB）。

## 方法

### 1. 先拿真实大小

```bash
curl -sIL --max-time 30 <url> | grep -iE "content-length|accept-ranges|location"
```

注意 `http://` 可能 301 到 `https://`，必须 `-L` 跟随再看 Content-Length（当日 Kepler 的 http 直查只返回 174 字节的 302 页长度）。

### 2. 循环 Range 续传，直到精确长度

```bash
TARGET=<content-length值>
for i in $(seq 1 40); do
  cur=$(stat -c %s file.pdf)
  [ "$cur" -ge "$TARGET" ] && break
  curl -s --max-time 95 -r ${cur}- "<url>" -o chunk.tmp
  cat chunk.tmp >> file.pdf
done
```

### 3. 校验与截断（关键）

```bash
# 尾部必须是 %%EOF；且总长 == TARGET
tail -c 20 file.pdf            # 应见 %%EOF
stat -c %s file.pdf            # 应 == TARGET，超了说明续传时把越界错误页拼进去了
# 超长时按精确长度截断（用 python，bash 工具截二进制不可靠）：
python3 -c "d=open('file.pdf','rb').read(); open('file.pdf','wb').write(d[:TARGET])"
```

### 4. 完成度判定

`%%EOF` 在尾 + 总长精确 = 传输完整。之后 `pdftotext` 若报 `Couldn't read xref table` 但仍提取出全文行数，警告可忽略（xref 偏移修复成功）；只提出几百字节则可能是无文字层扫描件（另一问题，见 scanned-pdf-no-text-layer.md）。

## 失败清单

| 尝试 | 结果 | 原因 |
|---|---|---|
| `curl -C -` 自动续传 | 文件越传越小/坏 | 服务器或中间层对断点的行为不一致，-C - 的假设失效 |
| 无限 Range 循环不看总长 | 尾部混入 HTML 错误页（`ends EOF: b'HTML>'`） | 最后一轮请求超范围，服务器返回 200 错误页被 cat 进文件 |
| 手工多次 `curl -r N-` 拼接 | 中段字节错位 | 两次写入的偏移重叠，文件里混入重复段

## 适用边界

- 只在「服务器支持 Accept-Ranges: bytes 且单连接有超时窗口」时用；服务器不支持 Range 时（少数）只能走浏览器下载。
- `stat -c %s` 是 GNU stat（Git Bash 有）；Windows 原生 cmd 无此命令。
