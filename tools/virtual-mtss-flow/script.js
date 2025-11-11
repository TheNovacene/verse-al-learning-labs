// Virtual MTSS Flow — no build, interactive SVG
// Stages: Universal → Trigger → Tier 2 → Tier 3 → Plan → Review (+ loop back to Tier 2)

const STAGES = [
  { key: "t1", label: "Universal", sub: "(3Cs + dual-mode)", tip: "Predictable 3Cs arc, dual access modes, visible task at top." },
  { key: "trig", label: "Trigger", sub: "(missed polls/low quiz)", tip: "Define triggers: exit-poll < 80%, quiz < 60%, absence 2x." },
  { key: "t2", label: "Tier 2", sub: "Clinic 10-min (3–5)", tip: "Targeted mini-sessions; pre-teach vocab; shrink task, same outcome." },
  { key: "t3", label: "Tier 3", sub: "Case meet in 7 days", tip: "One-page plan: hypothesis, two moves, success signal, review date." },
  { key: "plan", label: "Plan", sub: "Two moves", tip: "Routine + scaffold (e.g., schedule + alt submission); log care moves." },
  { key: "rev", label: "Review", sub: "10 school days", tip: "If goals unmet, revise plan and loop back to Tier 2." },
];

let done = {};         // key:boolean
let activeKey = null;

const S = { cx: 80, cy: 180, boxW: 160, boxH: 64, gap: 46, h: 360, w: 1080 };

function el(name, attrs = {}, children = []) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  (Array.isArray(children) ? children : [children]).forEach(c => c && n.append(c));
  return n;
}

function computeBoxes() {
  return STAGES.map((s, i) => {
    const x = S.cx + i * (S.boxW + S.gap);
    const y = S.cy - S.boxH / 2;
    return { ...s, x, y, cx: x + S.boxW / 2, cy: S.cy };
  });
}

function ratingColour(key, metrics) {
  // Colour rules driven by metrics & thresholds
  switch (key) {
    case "t1":
      return metrics.t1 >= 80 ? "ok" : (metrics.t1 >= 65 ? "warn" : "bad");
    case "t2":
      return metrics.t2 >= 70 ? "ok" : (metrics.t2 >= 50 ? "warn" : "bad");
    case "t3":
      return metrics.t3 >= 60 ? "ok" : (metrics.t3 >= 40 ? "warn" : "bad");
    case "rev":
      return metrics.review === "met" ? "ok" : "bad";
    default:
      return ""; // neutral
  }
}

function draw() {
  const metrics = {
    t1: Number(document.getElementById("t1Poll").value || 0),
    t2: Number(document.getElementById("t2Attend").value || 0),
    t3: Number(document.getElementById("t3Goals").value || 0),
    review: document.getElementById("reviewOutcome").value,
  };

  const root = document.getElementById("flow-root");
  root.innerHTML = "";

  const svg = el("svg", { width: 980, height: S.h, viewBox: `0 0 ${S.w} ${S.h}`, xmlns: "http://www.w3.org/2000/svg" });
  svg.append(el("defs", {}, [
    el("marker", { id: "arrow", viewBox: "0 0 10 10", refX: "6", refY: "5", markerWidth: "6", markerHeight: "6", orient: "auto-start-reverse" },
      el("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#0f172a" })
    )
  ]));

  const boxes = computeBoxes();

  // edges between boxes
  boxes.forEach((b, i) => {
    if (i === boxes.length - 1) return;
    const next = boxes[i + 1];
    const d = `M ${b.x + S.boxW} ${b.cy} L ${next.x} ${next.cy}`;
    const e = el("path", { d, class: "edge" + ((activeKey === b.key || activeKey === next.key) ? " active" : ""), "marker-end": "url(#arrow)" });
    svg.append(e);
  });

  // loopback from Review → Tier 2 (curved)
  const rev = boxes[5], t2 = boxes[2];
  const loop = el("path", {
    d: `M ${rev.x + S.boxW/2} ${rev.cy - S.boxH/2 - 8}
        C ${rev.x - 80} ${rev.cy - 140}, ${t2.x + 80} ${t2.cy - 140}, ${t2.x + S.boxW/2} ${t2.cy - S.boxH/2 - 8}`,
    class: "loop" + (metrics.review === "not-met" ? " active" : "")
  });
  svg.append(loop);
  const loopLbl = el("text", { x: (rev.cx + t2.cx)/2, y: rev.cy - 150, "text-anchor": "middle", class: "sublabel" });
  loopLbl.textContent = "Revise plan → back to Tier 2";
  svg.append(loopLbl);

  // boxes + labels + tips
  boxes.forEach((b) => {
    const colour = ratingColour(b.key, metrics);
    const g = el("g", { tabindex: 0 });
    g.addEventListener("mouseenter", () => { activeKey = b.key; draw(); });
    g.addEventListener("mouseleave", () => { activeKey = null; draw(); });
    g.addEventListener("click", () => { done[b.key] = !done[b.key]; draw(); });

    const box = el("rect", { x: b.x, y: b.y, rx: 10, ry: 10, width: S.boxW, height: S.boxH, class: `box ${colour}` });
    g.append(box);

    const lbl = el("text", { x: b.cx, y: b.cy - 6, "text-anchor": "middle", class: "blabel" });
    lbl.textContent = b.label;
    const sub = el("text", { x: b.cx, y: b.cy + 14, "text-anchor": "middle", class: "sublabel" });
    sub.textContent = b.sub;
    g.append(lbl); g.append(sub);

    if (activeKey === b.key) {
      const tipW = 240, tipH = 56, rx = 10;
      const tipBg = el("rect", { x: b.cx - tipW/2, y: b.y - tipH - 12, width: tipW, height: tipH, rx, ry: rx, class: "tip-bg" });
      const tipTx = el("text", { x: b.cx, y: b.y - 38, "text-anchor": "middle", class: "tip-text" });
      tipTx.textContent = b.tip;
      g.append(tipBg); g.append(tipTx);
    }

    // tick when done
    if (done[b.key]) {
      const tick = el("text", { x: b.x + S.boxW - 14, y: b.y + 18, "text-anchor": "end", class: "blabel" });
      tick.textContent = "✓";
      g.append(tick);
    }

    svg.append(g);
  });

  root.append(svg);
}

function reset() {
  done = {};
  document.getElementById("t1Poll").value = 62;
  document.getElementById("t2Attend").value = 55;
  document.getElementById("t3Goals").value = 40;
  document.getElementById("reviewOutcome").value = "not-met";
  draw();
}

function downloadSVG() {
  const svg = document.querySelector("#flow-root svg");
  if (!svg) return;
  const ser = new XMLSerializer();
  const src = ser.serializeToString(svg);
  const blob = new Blob([src], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "virtual_mtss_flow.svg"; a.click();
  URL.revokeObjectURL(url);
}

document.addEventListener("DOMContentLoaded", () => {
  draw();
  ["t1Poll","t2Attend","t3Goals","reviewOutcome"].forEach(id => {
    document.getElementById(id).addEventListener("input", draw);
    document.getElementById(id).addEventListener("change", draw);
  });
  document.getElementById("resetBtn").addEventListener("click", reset);
  document.getElementById("downloadBtn").addEventListener("click", downloadSVG);
});
