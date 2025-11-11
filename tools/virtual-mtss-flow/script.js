// Virtual MTSS Flow — clearer labels, status badges, HTML tooltip with wrapping

const STAGES = [
  { n:1, key:"t1",   label:"Universal", sub:"3Cs + dual-mode",
    tipHead:"Universal (Tier 1)",
    tipSub:"Make success predictable.",
    bullets:[
      "Same 3Cs arc every live",
      "Two access modes (watch+read, type+talk)",
      "Visible task at top"
    ]},
  { n:2, key:"trig", label:"Trigger", sub:"data thresholds",
    tipHead:"Trigger",
    tipSub:"Define, don’t debate.",
    bullets:[
      "Exit-poll < 80%",
      "Quiz < 60%",
      "2 consecutive absences"
    ]},
  { n:3, key:"t2",  label:"Tier 2", sub:"Clinic 10-min (3–5)",
    tipHead:"Tier 2 (targeted)",
    tipSub:"Move fast; shrink the task.",
    bullets:[
      "Mini-group: same time weekly",
      "Pre-teach vocab (90s audio)",
      "Same outcome, more scaffold"
    ]},
  { n:4, key:"t3",  label:"Tier 3", sub:"Case meet in 7 days",
    tipHead:"Tier 3 (individual)",
    tipSub:"One page, two moves.",
    bullets:[
      "Hypothesis in plain English",
      "Routine + scaffold",
      "Success signal and date"
    ]},
  { n:5, key:"plan",label:"Plan", sub:"Two moves",
    tipHead:"Plan",
    tipSub:"Log care moves; keep light.",
    bullets:[
      "Routine: schedule / check-in",
      "Scaffold: alt submission / visuals"
    ]},
  { n:6, key:"rev", label:"Review", sub:"10 school days",
    tipHead:"Review",
    tipSub:"Met? Close. Not met? Loop back.",
    bullets:[
      "Adjust plan, not the learner",
      "Return to Tier 2 if needed"
    ]},
];

let done = {};
let activeKey = null;

const S = { cx: 80, cy: 180, boxW: 170, boxH: 64, gap: 42, h: 360, w: 1100 };

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
  switch (key) {
    case "t1": return metrics.t1 >= 80 ? "ok" : (metrics.t1 >= 65 ? "warn" : "bad");
    case "t2": return metrics.t2 >= 70 ? "ok" : (metrics.t2 >= 50 ? "warn" : "bad");
    case "t3": return metrics.t3 >= 60 ? "ok" : (metrics.t3 >= 40 ? "warn" : "bad");
    case "rev": return metrics.review === "met" ? "ok" : "bad";
    default:    return "";
  }
}

function ratingText(colour){
  if(colour==="ok") return "OK";
  if(colour==="warn") return "Check";
  if(colour==="bad") return "Act";
  return "";
}

/* ---------- Tooltip (HTML) ---------- */
const tt = {
  el: null,
  mount(){ this.el = document.getElementById("tooltip"); },
  show(stage, evt){
    if(!this.el) return;
    this.el.innerHTML = `
      <div class="t-head">${stage.tipHead}</div>
      <div class="t-sub">${stage.tipSub}</div>
      <ul class="t-list">
        ${stage.bullets.map(b=>`<li>${b}</li>`).join("")}
      </ul>`;
    this.el.hidden = false;
    this.move(evt);
  },
  move(evt){
    if(!this.el) return;
    const pad = 12;
    this.el.style.transform = `translate(${evt.clientX + pad}px, ${evt.clientY + pad}px)`;
  },
  hide(){ if(this.el){ this.el.hidden = true; } }
};
/* ----------------------------------- */

function draw() {
  const metrics = {
    t1: Number(document.getElementById("t1Poll").value || 0),
    t2: Number(document.getElementById("t2Attend").value || 0),
    t3: Number(document.getElementById("t3Goals").value || 0),
    review: document.getElementById("reviewOutcome").value,
  };

  const root = document.getElementById("flow-root");
  root.innerHTML = "";

  const svg = el("svg", { width: 1020, height: S.h, viewBox: `0 0 ${S.w} ${S.h}`, xmlns: "http://www.w3.org/2000/svg" });
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

  // loopback from Review → Tier 2 (curved, dotted)
  const rev = boxes[5], t2 = boxes[2];
  const showLoop = metrics.review === "not-met";
  const loop = el("path", {
    d: `M ${rev.x + S.boxW/2} ${rev.cy - S.boxH/2 - 8}
        C ${rev.x - 80} ${rev.cy - 140}, ${t2.x + 80} ${t2.cy - 140}, ${t2.x + S.boxW/2} ${t2.cy - S.boxH/2 - 8}`,
    class: "loop" + (showLoop ? " active" : "")
  });
  svg.append(loop);
  if (showLoop){
    const loopLbl = el("text", { x: (rev.cx + t2.cx)/2, y: rev.cy - 150, "text-anchor": "middle", class: "sublabel" });
    loopLbl.textContent = "Revise plan → back to Tier 2";
    svg.append(loopLbl);
  }

  // boxes + labels + status badges + handlers
  boxes.forEach((b) => {
    const colour = ratingColour(b.key, metrics);
    const g = el("g", { tabindex: 0 });

    g.addEventListener("mouseenter", (evt) => { activeKey = b.key; draw(); tt.show(b, evt); });
    g.addEventListener("mousemove", (evt) => tt.move(evt));
    g.addEventListener("mouseleave", () => { activeKey = null; draw(); tt.hide(); });
    g.addEventListener("click", () => { done[b.key] = !done[b.key]; draw(); });

    // box
    const box = el("rect", { x: b.x, y: b.y, rx: 10, ry: 10, width: S.boxW, height: S.boxH, class: `box ${colour}` });
    g.append(box);

    // number badge (top-left)
    const num = el("text", { x: b.x + 10, y: b.y + 18, class:"sublabel" });
    num.textContent = b.n.toString();
    g.append(num);

    // status badge (top-right)
    const status = ratingText(colour);
    if (status){
      const badge = el("text", { x: b.x + S.boxW - 10, y: b.y + 18, "text-anchor":"end", class:`badge ${colour}` });
      badge.textContent = status;
      g.append(badge);
    }

    // main labels
    const lbl = el("text", { x: b.cx, y: b.cy - 6, "text-anchor": "middle", class: "blabel" });
    lbl.textContent = b.label;
    const sub = el("text", { x: b.cx, y: b.cy + 14, "text-anchor": "middle", class: "sublabel" });
    sub.textContent = b.sub;
    g.append(lbl); g.append(sub);

    // tick when done
    if (done[b.key]) {
      const tick = el("text", { x: b.x +
