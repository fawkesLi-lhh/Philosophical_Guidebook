// F-6 契约的 TS 形状 + loader/校验（唯一校验实现）。规则出处：docs/FEATURE.md F-6。
// v2（2026-10-16）：引用是裸字符串，目标由字段名决定——parents→tags，inherits/refutes→viewpoints。
export type Viewpoint = {
  key: string;
  parents: string[];            // 结构边：指向 tags
  inherits: string[];           // 论证边：继承（含点名引用）
  refutes: string[];            // 论证边：反驳
  year?: number | string;       // ISO 8601 任意精度；挂书标签则应机械继承书年
  anchors?: { file: string; p: string }[];
  provenance?: string;
  note?: string;
};

export type Tag = {
  key: string;
  kind: 'person' | 'school' | 'book' | 'period';
  parents: string[];            // 结构边：标签可挂标签（人→学派、书→人）
  years?: string;
  note?: string;
};

export type Demo = { viewpoints: Viewpoint[]; tags: Tag[] };

export class ValidationError extends Error {
  errors: string[];
  constructor(errors: string[]) { super(`数据校验失败 ${errors.length} 处:\n` + errors.map(e => '  - ' + e).join('\n')); this.errors = errors; }
}

// —— 时间：ISO 8601 任意精度 → 可比较数值（年.年内序），不伪造精度 ——
export function timeValue(t: number | string | undefined): number {
  if (t === undefined) return NaN;
  if (typeof t === 'number') return t;
  const s = t.trim();
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  const m = s.match(/^(-?\d{1,6})(?:-(\d{2}))?(?:-(\d{2}))?(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!m) return NaN;
  const [, y, mo, d, h, mi, se] = m;
  return parseFloat(`${y}.${String(mo ?? '00')}${d ?? '00'}${h ?? '00'}${mi ?? '00'}${se ?? '00'}`);
}

function readJsonl<T>(text: string): T[] {
  return text.split(/\r?\n/).filter(l => l.trim()).map(l => JSON.parse(l) as T);
}

export function parseDemo(viewpointsText: string, tagsText: string): Demo {
  return { viewpoints: readJsonl<Viewpoint>(viewpointsText), tags: readJsonl<Tag>(tagsText) };
}

export function validate(demo: Demo): string[] {
  const errs: string[] = [];
  const vpKeys = new Set<string>();
  const tagMap = new Map<string, Tag>();

  // 1. key 文件内唯一
  for (const v of demo.viewpoints) {
    if (vpKeys.has(v.key)) errs.push(`viewpoints key 重复: ${v.key}`);
    vpKeys.add(v.key);
  }
  for (const t of demo.tags) {
    if (tagMap.has(t.key)) errs.push(`tags key 重复: ${t.key}`);
    tagMap.set(t.key, t);
    if (!['person', 'school', 'book', 'period'].includes(t.kind)) errs.push(`tags kind 非法: ${t.key} kind=${t.kind}`);
  }

  // 2. 跨文件引用可解析（裸字符串：parents→tags，inherits/refutes→viewpoints）
  for (const v of demo.viewpoints) {
    v.parents.forEach(k => { if (!tagMap.has(k)) errs.push(`${v.key}.parents 悬空引用 tags:${k}`); });
    v.inherits.forEach(k => { if (!vpKeys.has(k)) errs.push(`${v.key}.inherits 悬空引用 viewpoints:${k}`); });
    v.refutes.forEach(k => { if (!vpKeys.has(k)) errs.push(`${v.key}.refutes 悬空引用 viewpoints:${k}`); });
    // 6. F-4：观点无 anchors 且无 provenance 报错
    if ((!v.anchors || v.anchors.length === 0) && !v.provenance) errs.push(`观点无出处(anchors/provenance 皆空): ${v.key}`);
  }
  for (const t of demo.tags) t.parents.forEach(k => { if (!tagMap.has(k)) errs.push(`tags ${t.key}.parents 悬空引用 tags:${k}`); });

  // 3. 论证边时间：time(子) >= time(父)，倒流响亮报错
  const vpByKey = new Map(demo.viewpoints.map(v => [v.key, v]));
  const tagYear = (t: Tag): number => {
    const m = t.years?.match(/-?\d{3,4}/);
    return m ? parseInt(m[0], 10) : NaN;
  };
  for (const v of demo.viewpoints) {
    const tChild = timeValue(v.year);
    for (const r of [...v.inherits, ...v.refutes]) {
      const p = vpByKey.get(r);
      if (!p) continue;
      const tParent = timeValue(p.year);
      if (!isNaN(tChild) && !isNaN(tParent) && tChild < tParent)
        errs.push(`时间倒流: ${v.key} (${v.year}) → ${r} (${p.year})`);
    }
  }

  // 4. 等时环：只走等时论证边（同年合法边不误伤）
  const eqAdj = new Map<string, string[]>();
  for (const v of demo.viewpoints) {
    const tv = timeValue(v.year);
    for (const r of [...v.inherits, ...v.refutes]) {
      const p = vpByKey.get(r);
      if (!p) continue;
      const tp = timeValue(p.year);
      if (!isNaN(tv) && !isNaN(tp) && tv === tp) {
        if (!eqAdj.has(v.key)) eqAdj.set(v.key, []);
        eqAdj.get(v.key)!.push(r);
      }
    }
  }
  const color = new Map<string, 0 | 1 | 2>();
  const dfs = (u: string, path: string[]) => {
    color.set(u, 1);
    for (const w of eqAdj.get(u) ?? []) {
      if (color.get(w) === 1) errs.push(`同年论证环: ${[...path.slice(path.indexOf(w)), w, u].join(' → ')}`);
      else if (!color.has(w)) dfs(w, [...path, w]);
    }
    color.set(u, 2);
  };
  for (const k of eqAdj.keys()) if (!color.has(k)) dfs(k, [k]);

  // 5. parents 成森林（防火墙：防数据手误致折叠静默递归）
  const pColor = new Map<string, 0 | 1 | 2>();
  const dfsP = (u: string) => {
    pColor.set(u, 1);
    for (const w of tagMap.get(u)?.parents ?? []) {
      if (w === u) continue;
      if (pColor.get(w) === 1) errs.push(`parents 环: ${u} ↔ ${w}`);
      else if (!pColor.has(w)) dfsP(w);
    }
    pColor.set(u, 2);
  };
  for (const t of tagMap.keys()) if (!pColor.has(t)) dfsP(t);

  return errs;
}

export function loadDemo(vpText: string, tagsText: string): Demo {
  const demo = parseDemo(vpText, tagsText);
  const errs = validate(demo);
  if (errs.length) throw new ValidationError(errs);
  return demo;
}
