# FEATURE — 当前功能决策（权威）

本文件是本项目当前功能决策的唯一权威。状态取值：`Required`（必须有）、`Approved`（已批准）、`Proposed`（提案中，未批准不得实现）、`Rejected`（否决）。

## 项目定位

按自定义哲学分类（哲学 ⊇ 数学 ⊇ 科学：形式验证者为数学，再经现实验证者为科学）梳理哲学家著作，提取观点与概念形成 DAG，支持任意观点/概念的上游来源、下游发展、反驳查询与前端多维可视化。

## F-1 数据布局（Proposed → 定稿讨论中，QA 2026-10-15 Q3–Q10）

目录结构提案：

```text
sources/                          # 原始文件，只读
  <哲学家>/<著作>/                 # 一书一目录（如 aristotle/metaphysics/）

texts/                            # 标准化正文，只读（标准化流水线写入后冻结）
  <成书年>-<哲学家>-<书名>.md       # 平铺不分哲学家文件夹：成书年前缀天然按时间排序；
                                   # BCE 为负数（-500 = 公元前500）；精度放 frontmatter composed_year
                                   # 语言跟随所获资源，优先原著语言，不统一翻译（Q5 落定，QA A12）；
                                   # frontmatter 记 language（BCP-47 短码）与 source_edition

buckets/                          # Appleby 索引器桶（本项目核心存储，写方：appleby-indexer CLI）
  books/<书id>/                   #   书桶：一书一桶，正文逐段 append，桶内文内提取
    indexer.md                    #   桶定义（从 extractors/ 拷入，桶自包含）
    memory.db                     #   唯一持久化文件
  federation/                     #   联合桶：一个普通桶，append 的 messages 是编辑记录
    indexer.md                    #   联合桶定义（跨书边、实体同一性、学派归属的谓词集）
    memory.db

extractors/                       # 提取器/索引器定义（md，目录为 create 的 definition 源）
  book-indexer.md                 #   书桶定义：focus/predicates/entities/normalization
  federation-indexer.md           #   联合桶定义：跨书边+同一性+学派谓词

scripts/                          # 本项目代码：查询期联接、校验、graph 重建
  validate.py                     #   出处完整、锚类型按桶检查、无环（按谓词分，反驳豁免）
  assemble.py                     #   多桶联接 → graph/（查询用联合视图，可随时重建）
  query.py                        #   F-2 三项查询入口（上游/下游/反驳）

graph/                            # 派生投影（assemble.py 重建，非权威存储）
  graph.json

frontend/                         # 前端（消费投影：只读 graph/，不反向写）
```

写方约定：sources/、texts/ 写入后冻结只读；buckets/ 只由 appleby-indexer CLI 写；graph/ 只由 scripts/ 重建；frontend/ 只读。

**双重出处完整性**：书桶陈述锚 = 书正文段落 id 区间；联合桶陈述锚 = 编辑记录自身 id 区间。同一谓词（发展/反驳）在书桶锚正文、在联合桶锚编辑记录，校验按桶类型机械检查，混用即失败（Q7→A9 落定）。

**桶闭包不受损**：书桶与联合桶都是标准 Appleby 桶，桶间无引用；跨桶联接只发生在查询期（scripts/），实体名消歧经联合桶同一性陈述，未消歧名字响亮报告。

待定项：Q10（无环豁免反驳，待确认）。Q4/Q5 已落定（QA 2026-10-15 A11/A12）。

## F-2 核心查询能力（Required）

输入任意观点或概念，可查到：
1. 上游来源（该观点/概念从哪些著作、哪些观点继承而来）；
2. 下游发展（哪些后续观点/概念由它发展而来）；
3. 下游反驳（哪些观点明确反驳它）。

此为项目存在的理由，任何设计与实现不得削弱这三项。

## F-3 边类型（Approved）

观点/概念之间的有向边固定三类：来源（source）、发展（development）、反驳（refutation）。新增边类型需先在本文件批准。

## F-4 出处完整性（Required）

每条观点、概念、边必须绑定原文出处（著作 + 位置）。无出处的条目不得进入图谱；校验脚本发现无出处条目视为失败。

## F-5 前端展示（Required）

- 图谱整体可视化，支持折叠与缩放各学派的研究；
- 支持按不同维度查看（至少：学派、时间）；
- 前端是消费投影：从数据文件生成视图，不反向写图谱数据。
