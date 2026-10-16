# 扫描件 PDF 无文字层的判定与对策

## 场景

PDF 下载成功、大小正常、尾部 %%EOF 正确，但 `pdftotext` 只输出几百字节——不是下载坏了，是扫描图像 PDF（Google Books / Dover 影印 / 老扫描件），整本没有文字层。

## 验证环境

2026-10-15。当日三例：哥白尼 1543（Google 扫描，31.5MB）、开普勒 GW III（Google 扫描，46MB）、哥德尔 1992 Dover 影印（4.2MB）——都只提取出声明页/封面噪声。

## 方法

### 1. 三级判定

```bash
pdftotext -layout file.pdf - | wc -c      # 几百字节 = 疑似无文字层
# 确证：数 PDF 对象
python3 -c "
d = open('file.pdf','rb').read()
print('fonts:', d.count(b'/Font'), 'images:', d.count(b'/Image'), 'pages:', d.count(b'/Type /Page') or d.count(b'/Type/Page'))
"
# fonts=0（或个位数）+ images≈pages*2 = 纯扫描件，无文字层
```

### 2. 对策（按优先级）

1. **同条目找 _djvu.txt**（archive.org 上传件大多带自动 OCR 文本，质量可用）：见 archive-org-via-appleby-browser.md 三步法。当日哥德尔 1931 就是靠 Collected Works Vol I 的 djvu.txt 拿到全文。
2. **找其他 identifier 的非扫描版**：同一本书常有多个上传件，advancedsearch 结果逐个试（401/403 换下一个）。
3. **找现代重排电子版**：GitHub 电子化仓库（TEI/LaTeX/text），原语言书名搜（见 github-raw-blocked.md）。Tractatus 1922 就是从 monoskop 拿到带文字层的 PDF。
4. **都无**：sources/ 收档扫描件 + 标注「待 OCR」；OCR 需要 tesseract（本机没有）或苹果系统 OCR，另行处理。

### 3. 入库纪律

扫描件本身留在 sources/（原始档案），texts/ 只收有文字层的内容——宁可缺待补，不把 0 字节或噪声当正文入库。

## 失败清单

| 尝试 | 结果 | 原因 |
|---|---|---|
| 反复重下 PDF | 同样几百字节 | 不是传输问题，文件本来就无文字层 |
| pdftotext 各种参数（-raw/-layout） | 无效 | 参数改变布局解析，不凭空造字 |
| 收 0 字节当「已收」 | 假完成 | 体检必查提取量，不是查文件大小 |

## 适用边界

- 判定法对「全本扫描」有效；部分混排书（几页文字+几页图）会提取出少量真文字，看提取量与页数的比例。
- djvu.txt 的 OCR 质量对老字体（哥特体/希腊文/俄文 1900s 铅印）会差，入库前抽样人检几段。
