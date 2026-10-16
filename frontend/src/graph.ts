// 图运算：当前视图计算（折叠/展开）。渲染器只消费这里的输出。
// 图只有两类节点：观点 与 tag；tag 层层嵌套（观点→书→人→学派→…），无特殊层。
// 折叠 = 沿 parents 链把观点收进第 depth 级祖先 tag；展开 = 深度回退一级。
import type { Demo, Viewpoint, Tag } from './loader';
import { timeValue } from './loader';

export type TagKind = Tag['kind'];

export type ViewNode = {
  key: string;
  label: string;
  year: number;               // 序数轴行对应年
  kind?: TagKind;             // tag 容器节点有；观点节点无
  memberKeys: string[];       // 该节点吸收的观点 key
  collapsed: boolean;         // tag 容器 = true
  depth: number;              // 该容器的折叠深度（= mode.depth 或展开后的 depth-1）
};

export type ViewEdge = { from: string; to: string; type: 'inherits' | 'refutes'; count: number };

export type GraphView = { nodes: ViewNode[]; edges: ViewEdge[] };

// 视图模式：
// depth   = 统一折叠深度。0 = 观点级全展开；k = 每个观点折进其第 k 级祖先 tag。
//           第 1 级 = parents 直接命中（观点→书/人/学派），第 2 级 = 该 tag 的 parent，以此类推。
//           深度超过某观点的祖先链长时，该观点停在链顶（无更高祖先可折）。
// open    = 在当前深度下例外展开的 tag key 集合（点击"展开此节点"产生）。
// 视图状态：folded = 当前折叠中的 tag 集合。
// 折叠一个 tag = 该 tag 祖先闭包内的全部观点（parents 链能到达它）收进一个节点。
// 观点归属规则：折叠多个 tag 时，观点归入其链上【最深的已折叠 tag】（离观点最近者）；
// 链上无已折叠 tag 的观点保持观点级。
// 初始展开一层 = 折叠全部「有直接成员观点的 tag」。
export type ViewMode = { folded: Set<string> };

// 观点的第 k 级祖先 tag：沿 parents 链向上走，收集所有 k 级祖先（可能多个，全部作为容器候选）
export function ancestorAtK(demo: Demo, v: Viewpoint, k: number): string[] {
  const tagByKey = new Map(demo.tags.map(t => [t.key, t]));
  let frontier = new Set(v.parents.filter(p => tagByKey.has(p)));
  for (let i = 1; i < k && frontier.size; i++) {
    const next = new Set<string>();
    for (const t of frontier) (tagByKey.get(t)?.parents ?? []).forEach(p => { if (tagByKey.has(p)) next.add(p); });
    frontier = next;
  }
  return [...frontier];
}

// tag 的直接成员观点（parents 直接含该 tag）
export function tagMembers(demo: Demo, tag: string): string[] {
  return demo.viewpoints.filter(v => v.parents.includes(tag)).map(v => v.key);
}

// 初始折叠一层：全部「有直接成员」的 tag（全局按钮 = 对每个调用一次单节点折叠）
export function foldOneLevel(demo: Demo): Set<string> {
  return new Set(demo.tags.filter(t => tagMembers(demo, t.key).length > 0).map(t => t.key));
}

// 论证边闭包（合并模式用）：从种子出发沿继承/反驳边的全部后代
export function descendsFrom(demo: Demo, seeds: Set<string>): Set<string> {
  const all = new Set(seeds);
  let grew = true;
  while (grew) {
    grew = false;
    for (const v of demo.viewpoints) {
      if (all.has(v.key)) continue;
      if (v.inherits.some(k => all.has(k)) || v.refutes.some(k => all.has(k))) { all.add(v.key); grew = true; }
    }
  }
  return all;
}

// 观点归入的折叠容器：其 parents 链上最深的已折叠 tag（无则 null = 保持观点级）
function foldTargetOf(demo: Demo, v: Viewpoint, folded: Set<string>): string | null {
  const tagByKey = new Map(demo.tags.map(t => [t.key, t]));
  // BFS 按深度找最近的已折叠祖先
  let frontier = v.parents.filter(p => tagByKey.has(p));
  const seen = new Set<string>();
  while (frontier.length) {
    for (const t of frontier) if (folded.has(t)) return t;
    const next: string[] = [];
    for (const t of frontier) {
      if (seen.has(t)) continue;
      seen.add(t);
      for (const p of tagByKey.get(t)?.parents ?? []) if (tagByKey.has(p) && !seen.has(p)) next.push(p);
    }
    frontier = next;
  }
  return null;
}

// 主计算：按 folded 集合产出当前视图
export function computeView(demo: Demo, mode: ViewMode): GraphView {
  const tagByKey = new Map(demo.tags.map(t => [t.key, t]));
  const nodes: ViewNode[] = [];
  const memberOf = new Map<string, string>();

  const buckets = new Map<string, string[]>();
  for (const v of demo.viewpoints) {
    const target = foldTargetOf(demo, v, mode.folded);
    if (!target) {
      memberOf.set(v.key, v.key);
      nodes.push({ key: v.key, label: v.key, year: timeValue(v.year), memberKeys: [v.key], collapsed: false, depth: 0 });
    } else {
      if (!buckets.has(target)) buckets.set(target, []);
      buckets.get(target)!.push(v.key);
    }
  }
  for (const [tag, members] of buckets) {
    members.forEach(k => memberOf.set(k, tag));
    const yrs = members.map(k => timeValue(demo.viewpoints.find(x => x.key === k)!.year)).filter(n => !isNaN(n));
    const t = tagByKey.get(tag);
    nodes.push({ key: tag, label: t?.key ?? tag, year: Math.min(...yrs), kind: t?.kind, memberKeys: members, collapsed: true, depth: 1 });
  }

  // 论证边聚合：跨容器保留类型与计数；容器内部隐藏
  const agg = new Map<string, ViewEdge>();
  for (const v of demo.viewpoints) {
    const from = memberOf.get(v.key)!;
    const add = (list: string[], type: 'inherits' | 'refutes') => {
      for (const r of list) {
        const to = memberOf.get(r) ?? r;
        if (to === from) continue;
        const id = `${from}|${to}|${type}`;
        const e = agg.get(id);
        if (e) e.count++;
        else agg.set(id, { from, to, type, count: 1 });
      }
    };
    add(v.inherits, 'inherits');
    add(v.refutes, 'refutes');
  }

  return { nodes, edges: [...agg.values()] };
}

// 标签祖先链：观点的直接 tags → 各 tag 沿 parents 向上到根
export function tagTreeOf(demo: Demo, vkey: string): { tag: string; kind?: string; parents: string[] }[] {
  const tagByKey = new Map(demo.tags.map(t => [t.key, t]));
  const v = demo.viewpoints.find(x => x.key === vkey);
  if (!v) return [];
  const seen = new Set<string>();
  const out: { tag: string; kind?: string; parents: string[] }[] = [];
  const visit = (k: string) => {
    if (seen.has(k)) return;
    seen.add(k);
    const t = tagByKey.get(k);
    if (!t) return;
    out.push({ tag: k, kind: t.kind, parents: t.parents });
    t.parents.forEach(visit);
  };
  v.parents.forEach(visit);
  return out;
}

// 三查询（F-2）：上游 = 继承回溯，下游 = 继承顺向，反驳 = refutes 边
export function query(demo: Demo, key: string) {
  const upstream: string[] = [], downstream: string[] = [], refutedBy: string[] = [], refutesNow: string[] = [];
  for (const v of demo.viewpoints) {
    if (v.inherits.includes(key)) downstream.push(v.key);
    if (v.refutes.includes(key)) refutedBy.push(v.key);
    if (v.key === key) {
      upstream.push(...v.inherits);
      refutesNow.push(...v.refutes);
    }
  }
  return { upstream, downstream, refutedBy, refutes: refutesNow };
}
