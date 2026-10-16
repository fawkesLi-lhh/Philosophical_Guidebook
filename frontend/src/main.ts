import { loadDemo, ValidationError } from './loader';
import { computeView, foldOneLevel, type ViewMode } from './graph';
import { renderTimeline, renderToolbar } from './render';

const DEMOS = ['evolution'];

async function fetchDemo(name: string) {
  const [vp, tags] = await Promise.all([
    fetch(`/data/${name}/viewpoints.jsonl`).then(r => { if (!r.ok) throw new Error(`fetch viewpoints ${r.status}`); return r.text(); }),
    fetch(`/data/${name}/tags.jsonl`).then(r => { if (!r.ok) throw new Error(`fetch tags ${r.status}`); return r.text(); }),
  ]);
  return loadDemo(vp, tags);
}

let currentDemo = DEMOS[0];
let current = await fetchDemo(currentDemo);
let mode: ViewMode = { folded: new Set<string>() };

const bar = document.getElementById('collapsebar')!;
const svg = document.querySelector('svg')!;
const errBox = document.getElementById('errbox')!;
const demoSel = document.getElementById('demoselect') as HTMLSelectElement;
for (const d of DEMOS) demoSel.add(new Option(d, d));
demoSel.value = currentDemo;
demoSel.onchange = async () => {
  currentDemo = demoSel.value;
  current = await fetchDemo(currentDemo);
  mode = { folded: new Set() };
  draw();
};

function draw() {
  errBox.style.display = 'none';
  try {
    renderToolbar(bar, current, mode, m => { mode = m; draw(); });
    renderTimeline(svg, computeView(current, mode), current, mode, m => { mode = m; draw(); });
  } catch (e) {
    if (e instanceof ValidationError) {
      errBox.style.display = 'block';
      errBox.textContent = e.message;
    } else throw e;
  }
}
draw();
