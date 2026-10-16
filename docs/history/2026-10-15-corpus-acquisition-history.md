# 语料获取过程史（2026-10-15，归档）

> 本文是 registry/sites.md（找书手册）的历史底稿：完整过程记录、失败清单、当日教训。当前操作以 sites.md 为权威，本文不再更新。

## 背景

项目需要 `docs/261014-日记3-哲学演化图谱.md` 中全部哲学家（33 节点，50 书目）的关键著作电子文本。一天内从 0 收到 78 本 / 118,823 段。语言政策从「优先原著」放宽为「任意译本即可，原著优先」（QA A12/A21）。

## 时间线（当日）

1. **上午**：建 registry/、scripts/、三站点登记。发现网络格局：curl 只通 gutenberg/perseus/logicmuseum/散点大学镜像；archive.org/wikisource/marxists/proletarian 全封锁。Gutenberg 批量下载 21 本（含拉丁沉思集/法单子论/德康德黑格尔/拉丁牛顿）。
2. **中午**：名哲言行录全本 + 切分毕达哥拉斯/德谟克利特/伊壁鸠鲁三卷（三个「残篇缺口」节点变可提取）。图灵 1936 / MP 1943 论文 PDF。浏览器通道（appleby browser host）首次死亡。
3. **下午**：bing/baidu 搜索引擎发现新源。GitHub API + raw 中转打通 MARX-EBOOKS（德意志意识形态 MEW3/MEGA II/5/费尔巴哈提纲/自然辩证法/反杜林论德文/列宁中文）。wilbourhall 数学史文库（花拉子米 Rosen 1831 哥白尼 1543）。monoskop（哥德尔 CW/Tractatus 1922）。gh-proxy 解锁 github raw（Begriffsschrift TEI）。
4. **晚**：用户提出用 appleby 实例做 computer use。阶段一（computer_*）因桌面弹窗全败；阶段二（browser_*）成功打通 archive.org：麦克斯韦电磁通论/伽利略两门新科学/库恩/列宁俄文，继而哥德尔 CW Vol I OCR（1931 全文）/波普尔/胡塞尔 LU 两卷+观念 I/海德格尔存在与时间/萨特/卡尔纳普/维纳/德里达/阿尔都塞——版权书九缺七补。
5. **深夜**：browser host 二次死亡（另一 appleby 实例占用，用户确认）。恢复后三 run 清完 12 项缺口：Ross 亚里士多德全本 6.4MB（run 中断后从 context.jsonl 抢救）切出工具论全六篇；莱布尼茨论组合术/哥白尼英译/开普勒剑桥英译/玻尔兹曼/布劳威尔/列宁哲学笔记/启蒙辩证法/维特根斯坦哲学研究/萨特法文节本。

## 关键失败与教训（按代价排序）

| 教训 | 代价 | 细节 |
|---|---|---|
| appleby 浏览器是单实例资源 | 两轮中断 | 其他 appleby 实例占用时 browser host 死（stdout closed）。启动代理前查残留进程 |
| Windows 非法文件名字符静默产 0 字节文件 | 反杜林论重跑 | 文件名含 `:` 写入失败但 stdout 打 OK；全量体检才抓到 |
| gpt5 实例偷懒用 curl | task6 全败 | 任务书第一条必须禁 curl + 说明封锁域 |
| computer_* 依赖干净桌面 | task1 五连败 | 日历弹窗+窗口干扰坐标 |
| Range 续传超范围 | 开普勒文件尾部混入错误页 | 续传前拿 Content-Length，按精确长度截断 |
| PDF 传输截断（~100s 窗口） | Hilbert/哥白尼/花拉子米多次重传 | 循环续传直到 %%EOF |
| bing 中文词搜索无效 | 多轮无效查询 | 英文书名原词+站名定向才有效；GitHub API 用原语言书名搜 |
| _djvu.txt 文件名不可猜 | task3 前半失败 | 必须 metadata API 拿真实文件名 |

## 未竟事项

- proletarian.me / marxists.org 已可达但未深挖（中文左翼/多语言马列还有余量）
- 三件扫描原件（哥白尼 1543 拉丁、开普勒 GW III 德文、哥德尔 1992 影印）待 OCR——均有替代文字版入库，优先级低
- 奥卡姆 Summa Logicae 其余卷（卷一 1-9 章已有）
- Ross 亚里士多德全本尚有 Physics/Metaphysics/伦理学等可切（sources/aristotle/ross_works_raw.txt 6.4MB）

## 产物索引

- `registry/corpus.md`：50 行书目状态表（51 已收/2 部分/0 缺口）
- `registry/sites.md`：找书手册（权威）
- `scripts/standardize_gutenberg.py / standardize_html.py / standardize_plaintext.py / merge_mew_html.py / chunked_download.py`
- `docs/QA/2026-10-15-corpus-run.md`：当日决策问答 Q13–Q22
