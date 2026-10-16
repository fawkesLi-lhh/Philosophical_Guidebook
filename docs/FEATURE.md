# FEATURE — 当前功能决策（权威）

本文件是本项目当前功能决策的唯一权威。状态取值：`Required`（必须有）、`Approved`（已批准）、`Proposed`（提案中，未批准不得实现）、`Rejected`（否决）、`Deferred`（批准后推迟）。

当前两条线：**展示线**（F-6 数据结构、F-7 前端、F-1 中 data/ 部分）先行；**提取线**（F-1 中 buckets/extractors/scripts 部分、F-8 索引器 PoC）随 M2 推迟，见 STATUS。两线共享 F-3/F-4 约束。

## 项目定位

按自定义哲学分类（哲学 ⊇ 数学 ⊇ 科学：形式验证者为数学，再经现实验证者为科学）梳理哲学家著作，提取观点与概念形成 DAG，支持任意观点/概念的上游来源、下游发展、反驳查询与前端多维可视化。

## F-1 数据布局（Approved，2026-10-16 拆两线；buckets 部分随提取线推迟生效）

```text
sources/                          # 原始文件，只读
  <哲学家>/<著作>/                 # 一书一目录（如 aristotle/metaphysics/）

texts/                            # 标准化正文，只读（写入后冻结）
  <成书年>-<哲学家>-<书名>.md       # 平铺：成书年前缀天然按时间排序；BCE 为负数（-500=公元前500）；
                                   # 精度放 frontmatter composed_year；语言跟随资源、优先原著（QA A12），
                                   # frontmatter 记 language 与 source_edition；
                                   # 段落机器编号 P0001 起，锚 = 文件 + 段号（A13）

data/                             # 展示线数据（demo 层；写方：人工/LLM 编辑，loader 校验）
  <demo>/                         #   一个 demo 一个目录，前端可选
    viewpoints.jsonl              #   记录形状见 F-6
    tags.jsonl

frontend/                         # 前端（只读 data/，纯静态产物，见 F-7）

buckets/                          # 提取线存储（写方：appleby-indexer CLI）【Deferred，随 M2】
  books/<书id>/                   #   书桶：一书一桶，正文逐段 append，桶内文内提取
    indexer.md                    #   桶定义（从 extractors/ 拷入，桶自包含）
    memory.db                     #   唯一持久化文件
  federation/                     #   联合桶：append 的 messages 是编辑记录
    indexer.md
    memory.db

extractors/                       # 索引器定义【Deferred，随 M2】
  book-indexer.md                 #   书桶定义：focus/predicates/entities/normalization
  federation-indexer.md           #   联合桶定义：跨书边+同一性+学派谓词（学派谓词随 F-5 改写待删）

scripts/                          # 提取线代码：查询期联接、校验【Deferred，随 M2/M5】
                                   #   注：demo 线校验由 frontend TS loader 承担（QA 2026-10-16 A8），
                                   #   两线合并时的归并届时定，不预写

graph/                            # 【Rejected by F-6】数据以 jsonl 为权威，不设中间投影层

registry/                         # 语料进度与获取方法记账（corpus.md / sites.md）
docs/                             # FEATURE / QA / STATUS / knowhow
```

写方约定：sources/、texts/ 写入后冻结只读；data/ 由编辑流程写、loader 校验后进前端；buckets/ 只由 appleby-indexer CLI 写；frontend/ 只读。

提取线两项原则（Deferred，随桶线生效）：**双重出处完整性**——书桶陈述锚 = 正文段落 id 区间，联合桶陈述锚 = 编辑记录自身 id 区间，混用即失败；**桶闭包不受损**——桶间无引用，跨桶联接只在查询期，未消歧名字响亮报告。

## F-2 核心查询能力（Required）

输入任意观点或概念，可查到：
1. 上游来源（该观点/概念从哪些著作、哪些观点继承而来）；
2. 下游发展（哪些后续观点/概念由它发展而来）；
3. 下游反驳（哪些观点明确反驳它）。

此为项目存在的理由，任何设计与实现不得削弱这三项。两类边下三查询的推导：上游 = 继承边指向上游方向的回溯、下游 = 继承边的顺向、反驳 = 反驳边（QA 2026-10-16 A6）。

## F-3 边类型（Approved，2026-10-16 改）

论证边固定两类：**继承**（inherits，含点名引用先人）、**反驳**（refutes）。另有结构边 parents（集合隶属，见 F-6），不是论证边。新增边类型需先在本文件批准。

历史：原三类（来源/发展/反驳）合并来源→继承，引用（cites）提案撤销，理由与推导见 QA 2026-10-16 A6。

## F-4 出处完整性（Required）

每条观点、概念、边必须绑定出处：原书锚定陈述锚定 texts/ 文件与段落号；编辑层陈述（LLM/人工整理）必须带 provenance 字段（如 `editor:llm-2026-10-16`）如实记录来源。无出处条目不得进入数据；loader 发现无出处条目视为失败。锚定语言跟随 data/ 所选语言策略（demo 全中文，QA 2026-10-16 A9）。

## F-5 前端展示（Approved，2026-10-16 改）

- 图谱整体可视化：观点为节点，时间轴竖直且为**序数轴**——只有有观点的年份才占一行，同年内多观点竖排展开（QA 2026-10-16 A13）；缩放与拖动浏览，自由布局后补；
- 只有两个结构操作：沿 parents 向上折叠、向下展开；书级/人级/学派级折叠是同一操作选不同目标标签；
- 论证边（继承/反驳）折叠时聚合保留类型与计数，不消失；
- 维度查看：时间（年）、标签（学派等 kind）；
- 前端只读 data/，纯静态产物，不反向写。

历史：原「按学派折叠」随学派容器方案否决改为标签维度（QA 2026-10-16 A4）。

## F-6 展示线数据结构（Approved，2026-10-16）

`data/<demo>/` 每 demo 两文件。key 即身份，无合成 id。

**viewpoints.jsonl**（一行一观点）：

```jsonl
{"key":"<中文观点语句>",
 "parents":["<标签名>"],
 "inherits":["<观点key>"],
 "refutes":["<观点key>"],
 "year":1748,
 "anchors":[{"file":"texts/1748-休谟-人类理解研究.md","p":"0031"}],
 "provenance":"editor:llm-2026-10-16",
 "note":""}
```

**tags.jsonl**（一行一标签）：

```jsonl
{"key":"休谟","kind":"person","parents":["经验主义"],"years":"1711-1776","note":""}
```

kind 取值：`person | school | book | period`。标签也是节点，parents 同样指针化；学派是标签维度不是嵌套容器。

规则：

- **key**：观点 key = 语句本身（demo 全中文）；标签 key = 名字。同句多出现 = 一条记录多锚；跨表述同义 = 不同 key，靠继承边接通（语义缺口，机械校验测不出，数据生产负责）。多人合著 = 复合人标签（如「马克思恩格斯」）。书 = 逻辑著作，语种版本不裂 key。
- **时间**：ISO 8601 任意精度（`1748` / `1748-05` / 全日期），禁止伪造精度。观点挂书标签则年机械继承书 composed_year；编辑层观点显式 year。
- **边存子方**：每条边只存一次，存在后来者记录里；下游查询线性扫描。
- **引用是裸字符串**（v2，QA 2026-10-16 A11）：目标由字段名决定——parents→tags，inherits/refutes→viewpoints；无 file 包装对象。
- **校验**（loader，单一实现，规则进 TS）：key 文件内唯一；引用（裸字符串）全部可解析；论证边逐条查 time(子) ≥ time(父)，倒流响亮报错；等时边 DFS 抓同年环（只走等时边，不误伤同年合法边）；parents 必须成森林（防数据手误致折叠静默递归，非图论需求）；观点无 anchors 且无 provenance 报错。
- **与提取线对齐**（非约束）：桶陈述本体 = key_raw_text + 锚，M3 数据进来时 key 即原文、anchors 即 evidences；届时中英 key 混存策略再定。

## F-7 展示线实现（Approved，2026-10-16）

- 纯 TS，无 Rust 无 wasm（QA 2026-10-16 A8）；契约三层：本文件 F-6（唯一权威）+ TS 类型 + loader/校验模块。
- Vite 唯一 devDependency，产物纯静态，任何静态服务器可开；无后端逻辑、无数据 bake-in、不追求 file:// 双击。
- 渲染 d3 + SVG，时间轴优先；渲染器只消费 loader 吐出的当前视图（加载/校验/折叠/查询都在 loader），可随时更换（规模升级路径 sigma.js/WebGL）。

## F-8 索引器 PoC（Deferred，随 M2）

书桶对 2–3 本论证密集书试跑，验证观点/论证/引用边提取质量；完成判据（预写评估标准）见 STATUS 路线区 M2。挂起决策：观点实体命名语言策略；Q10（assembled 图反驳边豁免——demo 线已用时间规则解决同类问题，桶线届时评估是否同样适用）。
