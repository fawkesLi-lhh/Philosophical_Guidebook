# STATUS — 当前快照与路线图

维护纪律（AGENT.md Work Mode 第 0 步与末步）：**每个工作会话开始读本文件，结束更新快照区**。路线区慢变，重大阶段变更才改。决策流水进 QA，功能决策进 FEATURE，本文件只放状态与指针。

## 快照（2026-10-15 会话末更新）

- **当前阶段**：M1 完成，M2 未开始
- **上次完成**：语料工程收口——texts/ 78 本 / 118,823 段全过体检；演化图 33 节点 0 缺口；获取经验沉淀为 registry/sites.md（找书手册），过程史归档 docs/history/2026-10-15-corpus-acquisition-history.md
- **下一步（M2 起步）**：重写索引器 PoC 方案（原方案文档已删）——选 2–3 本论证密集的书、写 extractors/book-indexer.md 草稿（谓词集：asserts/defines/argues-for/argues-against/derives-from/refutes/alias-of；重点：观点实体命名规则）、create 首桶 append 试跑、按预写标准评估提取质量
- **挂起决策**：
  - QA Q10：无环校验豁免反驳边（提案已给，待确认）
  - 观点实体命名语言策略（正文多语言，实体名需统一，A12 衍生，属 book-indexer.md 定义时定）
  - Q5 译本策略已放宽为「任意译本即可」，原著优先
- **阻塞**：无
- **关键指针**：
  - 语料状态：`registry/corpus.md`（51 已收/2 部分）
  - 找书方法：`registry/sites.md`（决策树/浏览器代理配方/技术坑）
  - 本轮全部决策：`docs/QA/2026-10-15.md`（Q1–Q11 机制）+ `docs/QA/2026-10-15-corpus-run.md`（Q13–Q23 执行）
  - 机制设计权威：`docs/FEATURE.md`（F-1 布局草案、F-2 三查询、A8 论证四段式、A9 联合桶）
  - 可复用方法库：`docs/knowhow/INDEX.md`（下载/Windows/Appleby/数据处理六篇，含失败清单）

## 路线图

- **M1 语料工程** ✅ 完成（2026-10-15）。演化图全节点公版电子文本入库，texts/ 标准化（成书年前缀命名、frontmatter、P 编号）。判据已满足：33 节点 0 实质缺口。
- **M2 索引器 PoC**（下一步）。用 Appleby 索引器对 2–3 本书做文内提取试跑，验证观点/论证/引用边的提取质量。完成判据：预写评估标准（实体名可独立读懂且跨段一致、argues-for/against 成链、证据锚落点正确、alias-of 接通异表述）记入 QA。
- **M3 F-1 定稿 + 批量建桶**。PoC 结果 + Q10 + 命名策略定稿后，data 布局写入 FEATURE 正式条目，全部 78 本建桶。
- **M4 联合桶**。buckets/federation/：跨书发展/反驳边、实体同一性、学派归属（QA A9：桶闭包不变，编辑记录为 messages，锚为编辑记录自身 id 区间）。
- **M5 查询层**。scripts/：多桶联接、消歧（未消歧响亮报告）、F-2 三项查询（上游来源/下游发展/下游反驳）、无环校验（按谓词分，豁免待 Q10）。
- **M6 前端**。graph/ 派生投影 + 前端可视化：学派折叠缩放、时间/学派多维度（F-5）。
