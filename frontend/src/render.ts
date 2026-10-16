// 竖直时间轴视图：y = 年（上=远古，下=当代），支持缩放/拖动。渲染器只消费 GraphView。
import * as d3 from 'd3';
import type { GraphView, ViewNode, ViewEdge, ViewMode } from './graph';
import { query, tagTreeOf, tagMembers, foldOneLevel } from './graph';
import type { Demo } from './loader';
import { layoutX } from './layout';

const W = 1200;                     // 画布宽；高度按行数动态（见 H2）
const M = { top: 60, bottom: 60, left: 60, right: 260 }; // right 给标签文字

export function renderTimeline(svgEl: SVGSVGElement, view: GraphView, demo: Demo, mode: ViewMode,
  onMode: (m: ViewMode) => void) {
  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();

  // 序数 y 轴：只有有观点的年份才占一行（自然压缩空档），同年内多观点竖排展开
  const sorted = [...view.nodes].filter(n => !isNaN(n.year)).sort((a, b) => a.year - b.year);
  const byYear = d3.group(sorted, n => n.year);
  const yearRows: number[] = [];
  for (const [, ns] of byYear) for (let i = 0; i < ns.length; i++) yearRows.push(ns[0].year);
  const rowH = 44;                                     // 每观点一行（含同年展开）
  const totalRows = Math.max(yearRows.length, 1);
  const H2 = M.top + M.bottom + totalRows * rowH;
  const yScale = d3.scalePoint<number>().domain(d3.range(totalRows)).range([M.top, H2 - M.bottom]);
  const rowOf = new Map<ViewNode, number>();
  { let r = 0; for (const [, ns] of byYear) for (const n of ns) rowOf.set(n, r++); }
  const y = (n: ViewNode) => yScale(rowOf.get(n) ?? 0)!;
  // 年份标签行：每年第一行
  const yearLabelRow = new Map<number, number>();
  for (const [, ns] of byYear) yearLabelRow.set(ns[0].year, rowOf.get(ns[0])!);
  // x 布局：docs/graph-x-layout-algorithm.md 三步法（IRLS 凸松弛 + 排名投影 + 2-opt）。
  // 仅继承边参与成本（QA A19）；反驳边画出不拉近。孤立节点 = 锚点，初始位（左右两端铺开）保持不动。
  const X_MIN = M.left + 60, X_MAX = W - M.right - 60;
  const SPACING = Math.min(46, (X_MAX - X_MIN) / Math.max(view.nodes.length - 1, 1));
  // 视图节点的继承目标（容器 = 成员并集，映射到视图节点）
  const keyToNode = new Map(view.nodes.map(nn => [nn.key, nn]));
  const inhEdges: { from: string; to: string }[] = [];
  for (const n of view.nodes) {
    const src = n.collapsed ? n.memberKeys : [n.key];
    const selfKeys = new Set(src);
    for (const k of src) {
      const v = demo.viewpoints.find(xx => xx.key === k);
      if (!v) continue;
      for (const r of v.inherits) {
        if (selfKeys.has(r)) continue;
        const tk = keyToNode.get(r)?.key;
        if (tk && tk !== n.key) inhEdges.push({ from: n.key, to: tk });
      }
    }
  }
  // 锚点初值：孤立节点（无继承边）按年序左右两端铺开
  const degN = new Map<string, number>();
  for (const e of inhEdges) { degN.set(e.from, (degN.get(e.from) ?? 0) + 1); degN.set(e.to, (degN.get(e.to) ?? 0) + 1); }
  const isolated = view.nodes.filter(n => !degN.get(n.key)).sort((a, b) => a.year - b.year);
  const initX = new Map<string, number>();
  const half = Math.ceil(isolated.length / 2);
  isolated.forEach((n, i) => {
    const leftSide = i < half;
    const idx = leftSide ? i : i - half;
    const cnt = leftSide ? half : isolated.length - half;
    const span = leftSide ? X_MIN + 30 : X_MAX - 30;
    initX.set(n.key, span + (leftSide ? 1 : -1) * (idx + 0.5) * Math.min(300, 560 / Math.max(cnt, 1)));
  });
  const layoutNodes = view.nodes.map(n => ({ key: n.key, y: y(n) }));
  const { x: xL, totalLength, sweeps } = layoutX(layoutNodes, inhEdges, initX, X_MIN, X_MAX, SPACING);
  console.info(`[layout] 继承边总长 ${Math.round(totalLength)}px，2-opt ${sweeps} 轮，${view.nodes.length} 节点`);
  const x = (n: ViewNode) => xL.get(n.key) ?? (X_MIN + X_MAX) / 2;

  // zoom + pan（滚轮缩放、左键拖动）
  svg.selectAll('g.__layer').remove();
  const gRoot = svg.append('g').attr('class', '__layer');
  // zoom 只绑一次：draw 重渲染不重复 call（重复绑定会叠加 click 抑制监听，第二次点击被吃掉）
  const svgElAny = svgEl as any;
  if (!svgElAny.__zoomBound) {
    svgElAny.__zoomBound = true;
    const g0 = gRoot;
    d3.select(svgEl).call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 8])
      .on('zoom', ev => {
        // gRoot 每次渲染重建，zoom 回调里动态找当前层
        const layer = d3.select(svgEl).select('g');
        layer.attr('transform', ev.transform);
      }) as any);
    void g0;
  }

  svg.attr('viewBox', `0 0 ${W} ${H2}`);
  // 年刻度（左侧，每年首行标注；公元前显示 前N）
  const fmt = (yy: number) => yy < 0 ? `前${-yy}` : `${yy}`;
  const ticks = gRoot.append('g');
  for (const [yy, row] of [...yearLabelRow.entries()].sort((a, b) => a[1] - b[1])) {
    const yy2 = yScale(row)!;
    ticks.append('text').attr('x', M.left - 14).attr('y', yy2 + 4)
      .attr('text-anchor', 'end').attr('font-size', 11).attr('fill', '#888').text(fmt(yy));
    ticks.append('line').attr('x1', M.left).attr('x2', W - M.right + 40)
      .attr('y1', yy2).attr('y2', yy2).attr('stroke', '#eee');
  }

  // 边
  // defs：箭头 marker（继承边指向下游）
  svg.select('defs').remove();
  const defs = svg.append('defs');
  const mk = defs.append('marker').attr('id', 'arrow-inh').attr('viewBox', '0 0 10 10')
    .attr('refX', 9).attr('refY', 5).attr('markerWidth', 7).attr('markerHeight', 7)
    .attr('orient', 'auto-start-reverse');
  mk.append('path').attr('d', 'M 0 1 L 9 5 L 0 9 z').attr('fill', '#7f8c8d');
  const mk2 = defs.append('marker').attr('id', 'arrow-ref').attr('viewBox', '0 0 10 10')
    .attr('refX', 9).attr('refY', 5).attr('markerWidth', 7).attr('markerHeight', 7)
    .attr('orient', 'auto-start-reverse');
  mk2.append('path').attr('d', 'M 0 1 L 9 5 L 0 9 z').attr('fill', '#c0392b');

  const link = gRoot.selectAll<SVGLineElement, ViewEdge>('line.edge')
    .data(view.edges).join('line')
    .attr('class', 'edge')
    .attr('x1', d => x(keyToNode.get(d.from)!)).attr('y1', d => y(keyToNode.get(d.from)!))
    .attr('x2', d => x(keyToNode.get(d.to)!)).attr('y2', d => y(keyToNode.get(d.to)!))
    .attr('stroke', d => d.type === 'refutes' ? '#c0392b' : '#7f8c8d')
    .attr('stroke-width', d => Math.min(1 + d.count * 0.6, 5))
    .attr('stroke-dasharray', d => d.type === 'refutes' ? '6,3' : null)
    .attr('marker-end', d => `url(#arrow-${d.type === 'refutes' ? 'ref' : 'inh'})`)
    .attr('opacity', 0.55);
  link.append('title').text(d => `${d.type} ×${d.count}: ${d.from} → ${d.to}`);

  // 节点（直接挂在 gRoot，不再套容器层）
  const g = gRoot.selectAll<SVGGElement, ViewNode>('g.node')
    .data(view.nodes, d => d.key).join('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${x(d)},${y(d)})`)
    .style('cursor', 'pointer');

  g.append('circle').attr('r', d => d.collapsed ? 14 + Math.min(d.memberKeys.length, 20) : 6 + Math.min(d.memberKeys.length, 12))
    .attr('fill', d => d.collapsed ? '#e67e22' : '#3498db').attr('stroke', '#fff').attr('stroke-width', 1.5);
  g.append('text').attr('x', 10).attr('y', -8).attr('font-size', 12)
    .text(d => d.label.length > 30 ? d.label.slice(0, 30) + '…' : d.label)
    .attr('fill', d => d.collapsed ? '#a04000' : '#2c3e50')
    .attr('font-weight', d => d.collapsed ? 'bold' : 'normal');

  // 原生绑定（目标阶段最先行），避开 d3.zoom 在 svg 捕获阶段的 click 抑制
  (g.nodes() as SVGGraphicsElement[]).forEach(el => {
    const node = d3.select(el).datum() as ViewNode;
    el.addEventListener('click', (ev: MouseEvent) => {
      ev.stopPropagation();
      try { showPanel(node, demo, mode, d3.select(svgEl), onMode); }
      catch (e) { console.error('showPanel failed:', e); }
    });
  });
}

// tag 的祖先链
function treeOfTag(demo: Demo, tag: string): { tag: string; kind?: string; parents: string[] }[] {
  const tagByKey = new Map(demo.tags.map(t => [t.key, t]));
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
  visit(tag);
  return out;
}

let panel: HTMLElement | null = null;
function showPanel(n: ViewNode, demo: Demo, mode: ViewMode,
  svgSel: d3.Selection<SVGSVGElement, unknown, null, undefined>, onMode: (m: ViewMode) => void) {
  panel?.remove();
  panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;right:16px;top:60px;width:380px;max-height:80vh;overflow:auto;background:#fff;border:1px solid #ccc;border-radius:8px;padding:12px;font-size:13px;box-shadow:0 2px 12px rgba(0,0,0,.15);z-index:10';

  const isTag = n.collapsed;
  // 标签链：观点节点 = 其 tags 及祖先；容器节点 = 容器 tag 及祖先
  const chain = isTag ? treeOfTag(demo, n.key) : tagTreeOf(demo, n.key);
  // 查询：容器 = 对成员三查询取并；观点 = 直接查
  const members = isTag ? n.memberKeys : [n.key];
  const q = {
    upstream: [...new Set(members.flatMap(k => query(demo, k).upstream).filter(k => !members.includes(k)))],
    downstream: [...new Set(members.flatMap(k => query(demo, k).downstream).filter(k => !members.includes(k)))],
    refutedBy: [...new Set(members.flatMap(k => query(demo, k).refutedBy).filter(k => !members.includes(k)))],
    refutes: [...new Set(members.flatMap(k => query(demo, k).refutes).filter(k => !members.includes(k)))],
  };
  const li = (ks: string[]) => ks.length ? `<ul>${ks.map(k => `<li data-vp="${k.replace(/"/g,'&quot;')}" style="cursor:pointer;color:#1a5276">${k}</li>`).join('')}</ul>` : '<p style="color:#999">无</p>';
  const chainHtml = chain.length
    ? '<ul>' + chain.map(t => `<li>${t.tag}<span style="color:#999">（${t.kind ?? '?'}）</span>${t.parents.length ? ' ← ' + t.parents.join(' ← ') : ''}</li>`).join('') + '</ul>'
    : '<p style="color:#999">无</p>';

  // 按钮：容器 → 展开此节点（加入 open）+ 折叠进各上级；观点 → 折叠进各直接 tag 的下一切换由深度统一控制，这里给「折叠到 X」
  const higher = isTag
    ? treeOfTag(demo, n.key).slice(1).map(t => t.tag)                     // 容器的祖先 tag（去掉自身）
    : chain.map(t => t.tag);                                              // 观点的全部 tag 链
  const btns = [
    ...(isTag ? [`<button data-open="${n.key}">▼ 展开此节点</button>`] : []),
    ...higher.map(t => `<button data-fold="${t}">▲ 折叠进「${t}」</button>`),
  ].join(' ');

  panel.innerHTML = `<h3 style="margin:0 0 6px">${isTag ? n.label : n.key}</h3>
    <p style="color:#888">年：${n.year}${members.length > 1 ? ` ｜ 成员 ${members.length} 个观点` : ''}</p>
    <b>标签链</b>${chainHtml}
    <b>上游（继承自）</b>${li(q.upstream)}
    <b>下游（发展出）</b>${li(q.downstream)}
    <b>被反驳</b>${li(q.refutedBy)}
    <b>反驳了</b>${li(q.refutes)}
    <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">${btns}</div>`;
  panel.addEventListener('click', e => {
    const t = e.target as HTMLElement;
    e.stopPropagation();
    if (t.dataset.open) {
      // 展开此节点：从 folded 中移除该 tag（其成员回观点级；嵌套在它内部的子折叠保留）
      panel?.remove(); panel = null;
      const f = new Set(mode.folded); f.delete(t.dataset.open);
      onMode({ folded: f });
    } else if (t.dataset.fold) {
      // 折叠进该 tag：加入 folded。若该 tag 的链上有更浅的已折叠祖先，二者同时存在时观点归更近者，无需撤销
      panel?.remove(); panel = null;
      onMode({ folded: new Set([...mode.folded, t.dataset.fold]) });
    } else if (t.dataset.vp) {
      window.dispatchEvent(new CustomEvent('locate-viewpoint', { detail: t.dataset.vp }));
    }
  });
  document.body.appendChild(panel);
  svgSel.on('click', () => { panel?.remove(); panel = null; svgSel.on('click', null); });
}

// 工具栏：tag 搜索 + 折叠一层/展开一层（tag 无特殊层，深度统一控制）
export function renderToolbar(el: HTMLElement, demo: Demo, mode: ViewMode, onMode: (m: ViewMode) => void) {
  el.innerHTML = '';
  const box = document.createElement('div');
  box.style.cssText = 'display:flex;gap:6px;align-items:center;position:relative';

  const input = document.createElement('input');
  input.type = 'search'; input.placeholder = '搜索标签…';
  input.style.width = '200px';
  const list = document.createElement('div');
  list.style.cssText = 'position:absolute;top:30px;left:0;background:#fff;border:1px solid #ccc;border-radius:6px;max-height:260px;overflow:auto;box-shadow:0 2px 12px rgba(0,0,0,.12);display:none;z-index:20;min-width:220px';
  const doSearch = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { list.style.display = 'none'; return; }
    const hits = demo.tags.filter(t => t.key.toLowerCase().includes(q));
    list.innerHTML = hits.length
      ? hits.map(t => `<div data-tag="${t.key}" style="padding:4px 10px;cursor:pointer">${t.key} <span style="color:#999">（${t.kind}）</span></div>`).join('')
      : '<div style="padding:4px 10px;color:#999">无匹配</div>';
    list.style.display = 'block';
  };
  input.addEventListener('input', doSearch);
  input.addEventListener('focus', doSearch);
  list.addEventListener('click', e => {
    const t = (e.target as HTMLElement).closest('[data-tag]') as HTMLElement | null;
    if (!t?.dataset.tag) return;
    list.style.display = 'none'; input.value = t.dataset.tag;
    // 定位该 tag：临时全展开并高亮其成员（简单方案：切 plain 并发事件）
    window.dispatchEvent(new CustomEvent('locate-tag', { detail: t.dataset.tag }));
  });

  const bDown = document.createElement('button');
  bDown.textContent = '全部折叠一层';
  bDown.onclick = () => onMode({ folded: foldOneLevel(demo) });
  const bUp = document.createElement('button');
  bUp.textContent = '全部展开';
  bUp.onclick = () => onMode({ folded: new Set() });
  const status = document.createElement('span');
  status.style.cssText = 'color:#666;font-size:12px';
  status.textContent = mode.folded.size === 0 ? '观点级' : `折叠中 ${mode.folded.size} 个标签`;

  box.append(bDown, bUp, input, status, list);
  el.appendChild(box);
}
