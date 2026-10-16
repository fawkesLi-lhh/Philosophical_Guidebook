# STATUS — 当前快照与路线图

维护纪律（AGENT.md Work Mode 第 0 步与末步）：**每个工作会话开始读本文件，结束更新快照区**。路线区慢变，重大阶段变更才改。决策流水进 QA，功能决策进 FEATURE，本文件只放状态与指针。

## 快照（2026-10-16 会话末更新）

- **当前阶段**：展示线（M-A）首版已跑通，待用户看效果迭代
- **上次完成**：demo0 全链落地——`data/evolution/`（39 观点 + 46 标签，演化图 md 机械转换 + 3 个真实 texts/ 锚点，provenance 全标 editor）；`frontend/`（loader.ts 六项校验单一实现、graph.ts 折叠/三查询、render.ts d3 时间轴、vite 插件服务 /data）。dev 与 dist 均验证通过：54 节点 45 边渲染、节点点击出三查询面板、标签折叠聚合边（橙色折叠节点）、校验错误红条。数据六项检查全过（悬空引用/时间倒流/同年环/parents 环/无出处：均无；MP神经元→信息论的时间倒流边已按史实修正删除）
- **下一步**：用户过目 demo 效果 → 定迭代方向（候选：自由力导向布局、节点详情面板常驻、demo 数据扩充、第二个 demo）。已知待改：renderTimeline 的 y 轴是 key 哈希散布非语义分层；refutes 边高亮/过滤
- **挂起决策**：
  - M2 提取线挂起项（原样保留）：观点实体命名语言策略；Q10 反驳边无环豁免
  - M3 时中英 key 混存策略（届时定）
- **阻塞**：无
- **关键指针**：
  - 看效果：`cd frontend && npm run dev`（或 `npm run build` 后任意静态服务器托管 dist/）
  - demo 数据：`data/evolution/{viewpoints,tags}.jsonl`；再生成：`python scripts/gen_evolution_demo.py`
  - 展示线设计权威：`docs/FEATURE.md` F-6/F-7；决策流水：`docs/QA/2026-10-16.md`
  - vite 服务父目录方法：`docs/knowhow/vite-serve-parent-dir.md`
  - 语料状态：`registry/corpus.md`（33 节点 0 缺口，texts/ 78 本 118,823 段）

## 路线图

- **M1 语料工程** ✅ 完成（2026-10-15）。演化图全节点公版电子文本入库，texts/ 标准化（成书年前缀命名、frontmatter、P 编号）。
- **M-A 展示线**（进行中，2026-10-16 插入，原 M6 拆出提前）。演化图 md → data/evolution/ 中文 demo → TS loader/校验 + d3 时间轴前端。设计已定稿（FEATURE F-6/F-7），不依赖提取线。
- **M2 索引器 PoC**（推迟）。用 Appleby 索引器对 2–3 本书做文内提取试跑，验证观点/论证/引用边的提取质量。完成判据：预写评估标准（实体名可独立读懂且跨段一致、成链、证据锚落点正确、接通异表述）记入 QA。
- **M3 提取线定稿 + 批量建桶**。PoC 结果 + 命名策略定稿后全部 78 本建桶；届时中英 key 与 demo 线数据归并方案。
- **M4 联合桶**。buckets/federation/：跨书继承/反驳边、实体同一性（桶闭包不变，编辑记录为 messages）。
- **M5 查询层**。多桶联接、消歧（未消歧响亮报告）、F-2 三项查询、无环校验（时间规则 or Q10 豁免，届时定）。
- **M6 前端合并**。展示线与提取线数据合并消费，折叠缩放、时间/标签多维度（F-5）。
