# 资源站点登记表

维护规则：每个站点记录可达性（curl / 仅浏览器）、提供什么、怎么用。失效或发现新站及时更新本文件。

| 站点 | URL | curl 可达 | 浏览器可达 | 提供内容 | 用法 | 状态 |
|---|---|---|---|---|---|---|
| Project Gutenberg | https://www.gutenberg.org/ | ✅ | ✅ | 公版电子书（英文译本为主，少量原著） | `/cache/epub/<id>/pg<id>.txt` 直下纯文本；`/ebooks/<id>` 看元数据 | 活跃，主力 |
| 无产阶级图书馆 | https://library.proletarian.me/index.php | ❌ | ✅ | 左翼/马克思主义文献（中英文，PDF/EPUB 为主），馆藏约 1.2 万笔 | 首页搜索框检索 → 详情页下载 | 活跃，路线 C 主力 |
| Internet Archive | https://archive.org/ | ❌ | ✅ | 公版扫描书（原著语言：拉丁文/德文等） | 待浏览器验证下载路径 | 待验证 |
| Wikisource | https://en.wikisource.org/ | ❌ | 待验证 | 原文维基文库（多语言原文） | 待验证 | curl 000 |
| Perseus | https://www.perseus.tufts.edu/ | ✅ | 待验证 | 希腊罗马原文+英译（Bekker 编号权威） | /hopper/text?doc=Perseus:text:1999.01.XXXX | 活跃；文本 id 需从页面 title 探测 |
| logicmuseum | http://www.logicmuseum.com/ | ✅ | - | 中世纪逻辑文献（奥卡姆 Summa Logicae 拉丁+英对照） | /authors/<名>/ 目录页 | 活跃 |
| CMU 课程镜像 | https://www.cs.cmu.edu/ | ✅ | - | 论文 PDF（McCulloch-Pitts 1943 已从此收） | 直接 URL | 散点可用 |
| cs.ox.ac.uk | https://www.cs.ox.ac.uk/ | ✅ | - | 图灵 1936 论文 PDF 镜像 | /activities/ieg/e-library/sources/ | 活跃 |
| archive.org | https://archive.org/ | ❌ | 浏览器(已断) | 公版扫描书 | 浏览器恢复后用 | 阻塞中 |
| Marxists Internet Archive | https://www.marxists.org/ | 待验证 | 待验证 | 马恩列著作多语言版本 | 待验证 | 待验证 |

## 新发现源（2026-10-15 下午，经 bing/baidu 搜索引擎发现）

| 站点 | URL | curl 可达 | 提供内容 | 用法 | 状态 |
|---|---|---|---|---|---|
| GitHub + API | https://api.github.com | ✅ | MARX-EBOOKS 组织的马恩全集（MEW 德文/MEGA/文集中文）+ 列宁全集中文 + 经典论文文本仓库 | api.github.com 列目录；github.com/<repo>/raw/<branch>/<path> 下载文件（raw.githubusercontent 直连 000，必须走 github.com 中转）；搜索限额 10次/分 | 活跃，路线C主力 |
| wilbourhall | http://www.wilbourhall.org/ | ✅ | 数学史文库：花拉子米 Rosen 1831、开普勒全集 I-IV、哥白尼 1543 扫描、Newton 等 PDF | /pdfs/ 直链；大文件需分块续传（100s 窗口多次） | 活跃 |
| Bing 搜索 | https://www.bing.com/search | ✅ | 搜索引擎（发现通道） | ?q=<词>&setlang=en&cc=US；结果质量一般但可用 | 中国出口节点，结果偏中文 |
| 百度搜索 | https://www.baidu.com/s | ⚠️ | 搜索引擎（发现通道） | 少量查询后触发安全验证；单次可用 | 限流 |
| arxiv | https://export.arxiv.org/api/query | ✅ | 论文（本项目基本用不上，二手） | API 查询 | 活跃 |
| plato.stanford.edu | https://plato.stanford.edu/ | ✅ | 斯坦福哲学百科（综述线索，非原著） | 条目页 | 活跃 |
| gitee | https://gitee.com/ | ✅ | 未发现镜像本项目所需资源 | - | 搜索是 JS 渲染 |
| dlut marx | http://marx.dlut.edu.cn/ | ✅ | 学院官网（非文库，无用） | - | 无用 |

## 核心方法：Appleby 实例做浏览器代理（2026-10-15 晚确立）

本机 curl 封锁域（archive.org/wikisource/marxists/proletarian 等）用此通道：
1. 启动：`Start-Process appleby --api gpt5 --task-file <任务.md> --tools "Bash,Read,Write,browser_navigate,browser_snapshot,browser_interact,browser_console"`（PowerShell 分离启动，工作目录用独立 test workspace）
2. 任务书要点：**不要用 computer_***（物理桌面有弹窗干扰坐标，实测失败）；只用 browser_* 工具链
3. archive.org 三步法：advancedsearch API (`https://archive.org/advancedsearch.php?q=<词>&fl[]=identifier&rows=10&output=json`) 搜 identifier → metadata API (`https://archive.org/metadata/<id>`) 拿真实文件名 → 直链下载 `_djvu.txt`（自动 OCR 文本，大多公版条目都有）
4. 结果约定：任务书要求 agent 每完成一项向 logs/cu_resultN.md 追加一行，便于主会话监控
5. 401 = 借阅锁（prints/lending），无账号不可下；403 = 地区或条目限制

## 新发现源（2026-10-15 晚，多语言搜索后）

| 站点 | URL | curl 可达 | 提供内容 | 用法 | 状态 |
|---|---|---|---|---|---|
| monoskop.org | https://monoskop.org/ | ✅ | 理论/哲学文献 wiki：哥德尔 Collected Works、维特根斯坦 Tractatus 1922、海德格尔《技术问题》各语版等 | /<人名> 页面列 /images/ 直链 PDF；大文件支持 Range 续传 | 活跃；版权书（存在与时间/胡塞尔/库恩）无 |
| gh-proxy.com | https://gh-proxy.com/ | ✅ | GitHub raw 加速代理（解锁 raw.githubusercontent 直连封锁） | https://gh-proxy.com/https://raw.githubusercontent.com/<repo>/<branch>/<path> | 活跃 |
| wilbourhall Kepler | https://www.wilbourhall.org/pdfs/Kepler_VOL_III.pdf | ✅ | 开普勒 Gesammelte Werke 全集（德文权威版，VOL III = Astronomia Nova 1609） | 46MB 分块续传中 | 后台下载 |

## 下载技术记录

- github.com 大文件 raw 302 → raw.githubusercontent.com（000 封锁）。解法：api.github.com 的 contents 接口列文件 + github.com/<repo>/raw/main/<path> 逐文件下载（单文件 <3MB 可直接成功）。
- wilbourhall PDF 20-35MB：单次连接 ~100s 传输窗口，用 Range 续传多次拼装，直到尾部 %%EOF。
- 哥白尼 1543 是 Google 扫描件无文字层：sources 收档，texts 待 OCR（列入待办）。
- 哥德尔 1931：monoskop 1992 Dover 影印版（van Heijenoort 英译影印，80 页扫描图）已收 sources/goedel/g92.pdf，同样无文字层待 OCR；Collected Works Vol I（含 1931 原文+英译文字版）只在 free-college.org（curl 000，封锁）。
- 多语言搜索结论（bing 英/德/法语组）：bing 国际结果不稳定，有效命中主要靠「站名+作者」定向搜（monoskop/wilbourhall/github 这类站内资源被索引到的词）。中文关键词在 bing 国际版效果差，英文+德文书名原词效果最好。
- Gutenberg math-heavy 书（PM/几何基础）txt 是说明文件，用 -images.html 或 PDF。

## 阻塞记录

- 2026-10-15：浏览器通道中断（browser host closed stdout），archive.org / proletarian / wikisource / marxists.org 的 curl 全部 000——这四源是剩余待收书的主通道，浏览器恢复后优先攻它们。
- 剩余待收的阻塞依赖（2026-10-15 下午更新）：哥德尔 1931（github/bing/镜像全失败，仅 archive.org 或 Springer DOI）、开普勒新天文学（wilbourhall 有 Kepler 全集 I-IV 德文卷，PDF 巨大待续传窗口）、列宁哲学笔记（列宁全集二版 55 卷不在 MLRAW 的 43 卷内）、版权书（库恩/波普尔/胡塞尔/海德格尔/萨特/德里达/卡尔纳普/阿尔都塞/启蒙辩证法——公网无合法全文，需 archive.org 借阅或放弃）、麦克斯韦电磁通论全本、弗雷格 Begriffsschrift、伽利略两种新科学、斯宾诺莎伦理学拉丁版。

## 备注

- 2026-10-15：curl 只有 gutenberg.org 通（200，~1.4s）；archive.org、wikisource、proletarian curl 均超时，但浏览器可开 proletarian（200，正常渲染）。判断：本机 curl 无代理，浏览器走了可用通道。下载按「curl 拿 Gutenberg，浏览器拿其他」分工。
- proletarian 是中文左翼图书馆，语料以中译为主；按语言政策（QA A12：优先原著语言）仅当原著语言不可得或该版本最优时使用。
