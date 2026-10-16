// x 布局：docs/graph-x-layout-algorithm.md 三步法实现（单一实现）。
// 1) IRLS 解连续松弛（凸）：min Σ_e √((x_i−x_j)² + (y_i−y_j)²)，锚点固定、自由节点解带权 Laplacian（稠密高斯消元）
// 2) 排名投影：x 排序 → 秩 1..n（排列约束，任意两节点 x 不同）
// 3) 2-opt 局部搜索：交换秩对，总边长下降则接受，直至无改进
// 边集：仅继承边（QA A19：反驳不参与定位）。REFUTES_IN_COST=false；若要把反驳计入改此处并记 QA。

export type LayoutNode = { key: string; y: number };
export type LayoutEdge = { from: string; to: string };

// 返回每个节点的 x（像素），spacing 为相邻秩间距
export function layoutX(nodes: LayoutNode[], edges: LayoutEdge[], initX: Map<string, number>,
  xMin: number, xMax: number, spacing: number): { x: Map<string, number>; totalLength: number; sweeps: number } {
  const n = nodes.length;
  if (n === 0) return { x: new Map(), totalLength: 0, sweeps: 0 };
  const idx = new Map(nodes.map((v, i) => [v.key, i]));
  const y = nodes.map(v => v.y);
  const E = edges.map(e => [idx.get(e.from)!, idx.get(e.to)!] as [number, number]).filter(([a, b]) => a !== undefined && b !== undefined && a !== b);

  // 孤立节点（无继承边）= 锚点：初始位置固定（调用方给的 initX，即铺开的孤儿位）
  const deg = new Array(n).fill(0);
  for (const [a, b] of E) { deg[a]++; deg[b]++; }
  const isAnchor = deg.map(d => d === 0);

  // —— 第 1 步：IRLS ——
  const x = nodes.map(v => initX.get(v.key) ?? (xMin + xMax) / 2);
  const free = nodes.map((_, i) => i).filter(i => !isAnchor[i]);
  const EPS = 1e-4;
  for (let iter = 0; iter < 30 && free.length; iter++) {
    // 权重
    const w = E.map(([a, b]) => 1 / Math.sqrt((x[a] - x[b]) ** 2 + (y[a] - y[b]) ** 2 + EPS));
    // 稠密 Laplacian（仅自由块）+ RHS
    const m = free.length;
    const A: number[][] = Array.from({ length: m }, () => new Array(m).fill(0));
    const b = new Array(m).fill(0);
    const fIdx = new Map(free.map((g, k) => [g, k]));
    E.forEach(([a, b2], ei) => {
      const wij = w[ei];
      const fa = fIdx.has(a), fb = fIdx.has(b2);
      if (fa && fb) {
        const ka = fIdx.get(a)!, kb = fIdx.get(b2)!;
        A[ka][ka] += wij; A[kb][kb] += wij;
        A[ka][kb] -= wij; A[kb][ka] -= wij;
      } else if (fa) { A[fIdx.get(a)!][fIdx.get(a)!] += wij; b[fIdx.get(a)!] += wij * x[b2]; }
      else if (fb) { A[fIdx.get(b2)!][fIdx.get(b2)!] += wij; b[fIdx.get(b2)!] += wij * x[a]; }
    });
    const sol = solveDense(A, b);
    free.forEach((g, k) => x[g] = sol[k]);
  }

  // —— 第 2 步：排名投影 ——
  const order = nodes.map((_, i) => i).sort((a, b2) => x[a] - x[b2]);
  const rank = new Array(n);
  order.forEach((gi, r) => rank[gi] = r + 1);

  // —— 第 3 步：2-opt ——
  const cost = (rk: number[]) => {
    let s = 0;
    for (const [a, b2] of E) s += Math.sqrt(((rk[a] - rk[b2]) * spacing) ** 2 + (y[a] - y[b2]) ** 2);
    return s;
  };
  const nbr: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b2] of E) { nbr[a].push(b2); nbr[b2].push(a); }
  const localDelta = (i: number, ri: number) => {
    let s = 0;
    for (const j of nbr[i]) s += Math.sqrt(((ri - rank[j]) * spacing) ** 2 + (y[i] - y[j]) ** 2);
    return s;
  };
  let sweeps = 0;
  for (; sweeps < 60; sweeps++) {
    let improved = false;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (nbr[i].includes(j)) continue;  // 互换相邻点退化，跳过
      const before = localDelta(i, rank[i]) + localDelta(j, rank[j]);
      const ri = rank[i], rj = rank[j];
      rank[i] = rj; rank[j] = ri;
      const after = localDelta(i, rank[i]) + localDelta(j, rank[j]);
      if (after < before - 1e-9) improved = true;
      else { rank[i] = ri; rank[j] = rj; }  // 回滚
    }
    if (!improved) break;
  }

  const span = (n - 1) * spacing;
  const xOut = new Map<string, number>();
  nodes.forEach((v, i) => xOut.set(v.key, xMin + (rank[i] - 1) / Math.max(n - 1, 1) * span));
  return { x: xOut, totalLength: cost(rank), sweeps };
}

// 稠密线性方程组：高斯消元 + 部分主元（n ≤ 数百足够快）
function solveDense(A: number[][], b: number[]): number[] {
  const m = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < m; c++) {
    let p = c;
    for (let r = c + 1; r < m; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const pv = M[c][c] || 1e-12;
    for (let r = c + 1; r < m; r++) {
      const f = M[r][c] / pv;
      for (let k = c; k <= m; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array(m).fill(0);
  for (let r = m - 1; r >= 0; r--) {
    let s = M[r][m];
    for (let k = r + 1; k < m; k++) s -= M[r][k] * x[k];
    x[r] = s / (M[r][r] || 1e-12);
  }
  return x;
}
