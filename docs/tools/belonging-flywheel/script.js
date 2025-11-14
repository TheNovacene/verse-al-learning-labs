// Belonging Flywheel — vanilla JS, self-contained SVG
// Features: hover tips, click toggle done, live label edits, add step, download SVG.

const DEFAULT_STEPS = [
  { key: "ritual", label: "Ritual", tip: "Predictable openings (2-min Monday video; name-based roll-call)." },
  { key: "safety", label: "Safety", tip: "Camera-optional, multi-modal invites. Contribution without exposure." },
  { key: "micro", label: "Micro-contribution", tip: "Polls, emoji, sentence stems. Tiny steps build momentum." },
  { key: "recognition", label: "Recognition", tip: "Name the effort, not the person. Public praise; private coaching." },
];

let steps = JSON.parse(JSON.stringify(DEFAULT_STEPS));
let done = {};         // key:boolean
let activeKey = null;  // key|string|null

const state = { r: 140, cx: 220, cy: 220, w: 520, h: 520 };

function el(name, attrs = {}, children = []) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  (Array.isArray(children) ? children : [children]).forEach(c => c && n.append(c));
  return n;
}

function computePoints() {
  const n = steps.length;
  return steps.map((s, i) => {
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2; // start at top
    const x = state.cx + state.r * Math.cos(ang);
    const y = state.cy + state.r * Math.sin(ang);
    return { ...s, x, y };
  });
}

function draw() {
  const root = document.getElementById("flywheel-root");
  root.innerHTML = "";

  const svg = el("svg", { width: 440, height: 440, viewBox: "0 0 440 440", xmlns: "http://www.w3.org/2000/svg" });
  svg.append(el("defs", {}, [
    el("marker", { id: "arrow", viewBox: "0 0 10 10", refX: "6", refY: "5", markerWidth: "6", markerHeight: "6", orient: "auto-start-reverse" },
      el("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#0f172a" })
    )
  ]));

  // background ring + centre text
  svg.append(el("circle", { cx: state.cx, cy: state.cy, r: state.r + 38, fill: "#f9fafb", stroke: "#e5e7eb" }));
  const c1 = el("text", { x: state.cx, y: state.cy - 6, "text-anchor": "middle", class: "center1" });
  c1.textContent = "Rhythm → Safety → Contribution → Praise";
  const c2 = el("text", { x: state.cx, y: state.cy + 14, "text-anchor": "middle", class: "center2" });
  c2.textContent = "Students regulate to rhythm, not freedom";
  svg.append(c1); svg.append(c2);

  const pts = computePoints();

  // edges
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const midX = (p.x + q.x) / 2;
    const midY = (p.y + q.y) / 2;
    const dx = q.x - p.x, dy = q.y - p.y;
    const norm = Math.hypot(dx, dy) || 1;
    const px = -(dy / norm) * 26;
    const py = (dx / norm) * 26;
    const d = `M ${p.x} ${p.y} Q ${midX + px} ${midY + py} ${q.x} ${q.y}`;

    const edge = el("path", {
      d, class: "edge" + ((activeKey === p.key || activeKey === q.key) ? " active" : ""),
      "marker-end": "url(#arrow)"
    });
    svg.append(edge);
  });

  // nodes
  pts.forEach((p) => {
    const g = el("g", { tabindex: 0 });
    g.addEventListener("mouseenter", () => { activeKey = p.key; draw(); });
    g.addEventListener("mouseleave", () => { activeKey = null; draw(); });
    g.addEventListener("click", () => { done[p.key] = !done[p.key]; draw(); });

    const ring = el("circle", {
      cx: p.x, cy: p.y, r: 38,
      class: "node-ring" + (done[p.key] ? " done" : "")
    });
    g.append(ring);

    const label = el("text", {
      x: p.x, y: p.y + (done[p.key] ? 4 : 0),
      "text-anchor": "middle",
      class: "node-label" + (done[p.key] ? " done" : "")
    });
    label.textContent = p.label;
    g.append(label);

    if (activeKey === p.key) {
      const tipW = 220, tipH = 48, rx = 10;
      const tipBg = el("rect", { x: p.x - tipW / 2, y: p.y - 72, width: tipW, height: tipH, rx, ry: rx, class: "tip-bg" });
      const tipTx = el("text", { x: p.x, y: p.y - 44, "text-anchor": "middle", class: "tip-text" });
      tipTx.textContent = p.tip;
      g.append(tipBg); g.append(tipTx);
    }

    svg.append(g);
  });

  root.append(svg);
}

function renderEditor() {
  const ed = document.getElementById("editor");
  ed.innerHTML = "";
  steps.forEach((s, idx) => {
    const row = document.createElement("div");
    row.className = "row";
    const input = document.createElement("input");
    input.value = s.label;
    input.setAttribute("aria-label", `Label for step ${idx + 1}`);
    input.addEventListener("input", (e) => {
      steps[idx].label = e.target.value;
      draw();
    });
    const toggle = document.createElement("button");
    toggle.className = done[s.key] ? "btn" : "btn-outline";
    toggle.textContent = done[s.key] ? "Done" : "Mark done";
    toggle.addEventListener("click", () => { done[s.key] = !done[s.key]; draw(); renderEditor(); });
    row.append(input, toggle);
    ed.append(row);
  });
}

function reset() {
  steps = JSON.parse(JSON.stringify(DEFAULT_STEPS));
  done = {};
  draw(); renderEditor();
}

function addStep() {
  const idx = steps.length + 1;
  steps = steps.concat([{
    key: `custom_${idx}`,
    label: "Co-design",
    tip: "Families/students co-write one small change; implement within a week."
  }]);
  draw(); renderEditor();
}

function downloadSVG() {
  const svg = document.querySelector("#flywheel-root svg");
  if (!svg) return;
  const ser = new XMLSerializer();
  const src = ser.serializeToString(svg);
  const blob = new Blob([src], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "belonging_flywheel.svg"; a.click();
  URL.revokeObjectURL(url);
}

document.addEventListener("DOMContentLoaded", () => {
  draw(); renderEditor();
  document.getElementById("resetBtn").addEventListener("click", reset);
  document.getElementById("addStep").addEventListener("click", addStep);
  document.getElementById("downloadBtn").addEventListener("click", downloadSVG);
});
