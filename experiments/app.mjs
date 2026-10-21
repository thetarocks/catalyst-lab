import { experiments } from "./content.mjs";
import { models } from "./models.mjs";
const main = document.querySelector("main");
const colors = [
  "#286044",
  "#ad583c",
  "#526b9d",
  "#9b7628",
  "#775386",
  "#467d80",
  "#7b654f",
  "#a34c73",
];
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (x) =>
  Number.isInteger(x)
    ? x.toLocaleString("en-US")
    : x.toLocaleString("en-US", { maximumFractionDigits: 3 });
let activeResult, activeParams, activeId;
function chart(c, index) {
  const all = c.series.flatMap((s) => s.points),
    xs = all.map((p) => p[0]),
    ys = all.map((p) => p[1]);
  let minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  if (c.kind === "histogram") minY = 0;
  if (minX === maxX) {
    minX -= 0.5;
    maxX += 0.5;
  }
  if (minY === maxY) {
    minY -= 0.5;
    maxY += 0.5;
  }
  const yPad = (maxY - minY) * 0.08;
  maxY += yPad;
  if (c.kind !== "histogram") minY -= yPad;
  const W = 700,
    H = 315,
    left = 65,
    right = 18,
    top = 20,
    bottom = 55,
    px = (x) => left + ((x - minX) / (maxX - minX)) * (W - left - right),
    py = (y) => H - bottom - ((y - minY) / (maxY - minY)) * (H - top - bottom);
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="chart-title-${index} chart-desc-${index}"><title id="chart-title-${index}">${esc(c.title)}</title><desc id="chart-desc-${index}">${esc(c.x)} versus ${esc(c.y)}. Numerical values are in the expandable chart data table below.</desc>`;
  for (let i = 0; i <= 4; i++) {
    let v = minY + ((maxY - minY) * i) / 4,
      y = py(v);
    svg += `<line x1="${left}" x2="${W - right}" y1="${y}" y2="${y}" stroke="#d9dcd2"/><text x="${left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#626c65">${fmt(v)}</text>`;
    v = minX + ((maxX - minX) * i) / 4;
    svg += `<text x="${px(v)}" y="${H - 33}" text-anchor="middle" font-size="11" fill="#626c65">${fmt(v)}</text>`;
  }
  c.series.forEach((s, i) => {
    const color = colors[i % colors.length];
    if (c.kind === "histogram") {
      const width = ((W - left - right) / s.points.length) * 0.88;
      s.points.forEach(([x, y]) => {
        svg += `<rect x="${px(x) - width / 2}" y="${py(y)}" width="${width}" height="${py(0) - py(y)}" fill="${color}" opacity=".8"><title>${esc(s.name)}: ${fmt(x)}, ${fmt(y)}</title></rect>`;
      });
    } else if (s.scatter) {
      s.points.forEach(([x, y]) => {
        svg += `<circle cx="${px(x)}" cy="${py(y)}" r="${s.points.length === 1 ? 6 : 2}" fill="${color}" opacity="${s.points.length === 1 ? 1 : 0.22}"><title>${fmt(x)}, ${fmt(y)}</title></circle>`;
      });
    } else {
      svg += `<path d="${s.points.map(([x, y], j) => `${j ? "L" : "M"}${px(x).toFixed(2)},${py(y).toFixed(2)}`).join(" ")}" fill="none" stroke="${color}" stroke-width="2.4" ${i === 1 ? 'stroke-dasharray="6 4"' : ""}/>`;
    }
  });
  svg += `<text x="${(W + left - right) / 2}" y="${H - 4}" text-anchor="middle" font-size="12" fill="#626c65">${esc(c.x)}</text><text x="15" y="${(H - bottom + top) / 2}" text-anchor="middle" transform="rotate(-90 15 ${(H - bottom + top) / 2})" font-size="11" fill="#626c65">${esc(c.y)}</text></svg>`;
  return `<figure class="chart"><h3>${esc(c.title)}</h3>${svg}<figcaption class="legend">${c.series.map((s, i) => `<span><i style="background:${colors[i % colors.length]}"></i>${esc(s.name)}</span>`).join("")}</figcaption><details><summary>Read chart data (${all.length.toLocaleString()} points)</summary><div class="chart-data"><table><thead><tr><th>Series</th><th>${esc(c.x)}</th><th>${esc(c.y)}</th></tr></thead><tbody>${c.series.map((s) => s.points.map(([x, y]) => `<tr><th scope="row">${esc(s.name)}</th><td>${fmt(x)}</td><td>${fmt(y)}</td></tr>`).join("")).join("")}</tbody></table></div></details></figure>`;
}
function network({ L, defaults }) {
  const n = L.length,
    xy = Array.from({ length: n }, (_, i) => [
      240 + 105 * Math.cos((i * Math.PI * 2) / n - Math.PI / 2),
      145 + 105 * Math.sin((i * Math.PI * 2) / n - Math.PI / 2),
    ]);
  return `<figure class="chart network"><h3>Who owes whom?</h3><svg viewBox="0 0 480 290" role="img" aria-label="Eight-bank network. Arrows point from borrower to creditor; red banks pay less than promised."><defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#889a8d"/></marker></defs>${L.map(
    (row, i) =>
      row
        .map((v, j) => {
          if (!v) return "";
          const [x, y] = xy[i],
            [a, b] = xy[j],
            dx = a - x,
            dy = b - y,
            len = Math.hypot(dx, dy);
          return `<line x1="${x + (dx / len) * 19}" y1="${y + (dy / len) * 19}" x2="${a - (dx / len) * 21}" y2="${b - (dy / len) * 21}" stroke="#889a8d" opacity=".45" stroke-width="${Math.min(3, 1 + v / 200)}" marker-end="url(#arrow)"><title>Bank ${i + 1} owes Bank ${j + 1}: ${fmt(v)} units</title></line>`;
        })
        .join(""),
  ).join(
    "",
  )}${xy.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="18" fill="${defaults[i] ? "#a64e36" : "#286044"}"/><text x="${x}" y="${y + 5}" font-size="13" text-anchor="middle" fill="white">${i + 1}</text>`).join("")}</svg><figcaption class="small">Arrow: borrower → creditor. Rust: less than full payment. Green: paid in full. Society claims are omitted from this diagram and included in clearing.</figcaption><details><summary>Inspect interbank liabilities</summary><div class="chart-data"><table><thead><tr><th>Debtor → creditor</th><th>Units owed</th></tr></thead><tbody>${L.map((row, i) => row.map((v, j) => (v ? `<tr><th scope="row">Bank ${i + 1} → Bank ${j + 1}</th><td>${fmt(v)}</td></tr>` : "")).join("")).join("")}</tbody></table></div></details></figure>`;
}
function index() {
  activeId = null;
  document.title = "Experiments · Your Catalyst";
  main.innerHTML = `<section class="hero"><div><p class="eyebrow">A notebook of computational experiments</p><h1>Good questions.<br>Testable models.</h1><p class="lede">What happens when an economic rule meets a messy constraint? Six experiments in markets, money and the systems that connect them.</p></div><aside class="notebook"><p class="section-label">How to use this notebook</p><p>Start with a question. Change an assumption. Follow the mechanism through the numbers.</p><p>Each experiment includes its model, a worked example and the places where the explanation stops holding.</p><p class="small">No live prices. No black-box forecasts. Every stochastic run has a seed.</p></aside></section><div class="catalog-head"><span>FIELD NOTES / 6 EXPERIMENTS</span><span>INTERACTIVE MODELS + METHODS + SOURCE</span></div>${Object.entries(
    experiments,
  )
    .map(
      ([id, e]) =>
        `<a class="experiment-row" href="#${id}"><span class="serial">${e.no}</span><div><p class="tag">${e.area}</p><h2>${e.title}</h2><span class="small">${e.subtitle}</span></div><p class="row-desc">${e.question}</p><span class="row-arrow" aria-hidden="true">↗</span></a>`,
    )
    .join(
      "",
    )}<section class="index-note"><p class="section-label">Part of a larger inquiry</p><p>These models sit alongside the <a href="../">JoSAA allocation audit</a> and <a href="https://github.com/thetarocks/dao-sybil-resilience">DAO Sybil-resilience work</a>. The common thread is a practical one: encode a rule, inspect its behavior, and say exactly what the evidence supports.</p></section>`;
}
function control(c) {
  if (c.options)
    return `<div class="control"><label for="${c.key}">${c.label}</label><select name="${c.key}" id="${c.key}">${c.options.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select>${c.help ? `<p class="help">${c.help}</p>` : ""}</div>`;
  return `<div class="control"><label for="${c.key}">${c.label}<output for="${c.key}" id="out-${c.key}"></output></label><input id="${c.key}" name="${c.key}" type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}">${c.help ? `<p class="help">${c.help}</p>` : ""}</div>`;
}
function readParams(e, query) {
  const params = { seed: 42 };
  for (const c of e.controls) {
    let v = Number(query.get(c.key) ?? c.value);
    if (!Number.isFinite(v)) v = c.value;
    if (c.options) {
      if (!c.options.some(([o]) => o === v)) v = c.value;
    } else {
      v = Math.max(c.min, Math.min(c.max, v));
      v = +(c.min + Math.round((v - c.min) / c.step) * c.step).toFixed(6);
    }
    params[c.key] = v;
  }
  const seed = Number(query.get("seed") ?? 42);
  params.seed = Number.isFinite(seed)
    ? Math.min(4294967295, Math.max(0, Math.round(seed)))
    : 42;
  return params;
}
function detail(id, query) {
  const e = experiments[id];
  activeId = id;
  document.title = `${e.title} · Your Catalyst`;
  const params = readParams(e, query);
  main.innerHTML = `<a class="back" href="#">← All experiments</a><article><header class="detail-head"><p class="eyebrow">EXPERIMENT ${e.no} / ${e.area}</p><h1>${e.title}</h1><p class="subtitle">${e.subtitle}</p><p class="question">${e.question}</p><p class="intro">${e.intro}</p><div class="tags">${e.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div></header><section class="workspace" aria-label="Interactive experiment"><aside class="controls"><form><p class="section-label">The experiment</p><h2>Change an assumption.</h2>${e.controls.map(control).join("")}<div class="control"><label for="seed">Random seed</label><input id="seed" name="seed" type="number" min="0" max="4294967295" step="1" value="42"><p class="help">Same model + same inputs + same seed = same result. AMM results are analytic and do not use randomness.</p></div><p class="section-label">Try a starting point</p><div class="presets">${e.presets.map(([label], i) => `<button type="button" data-preset="${i}">${label}</button>`).join("")}</div><button class="primary" type="submit">Run experiment →</button><div class="actions"><button type="button" id="reset">Reset</button><button type="button" id="share">Copy run link</button><button type="button" id="json">JSON ↓</button><button type="button" id="csv">CSV ↓</button></div><p id="status" class="status" role="status" aria-live="polite"></p><div id="share-fallback"></div></form></aside><div id="results" aria-label="Simulation results"></div></section><section class="reading"><p class="eyebrow">MODEL NOTES / WHAT THE NUMBERS MEAN</p><h2>Open the model.</h2>${e.story.map(([title, text], i) => `<div class="step"><span class="serial">0${i + 1}</span><div><h3>${title}</h3><p>${text}</p></div></div>`).join("")}<pre class="equation">${esc(e.formula)}</pre><h3>A small worked example</h3><p>${e.worked}</p><h2>Two things to try</h2><ul>${e.try.map((t) => `<li>${t}</li>`).join("")}</ul><div class="method-box"><h3>Where this model stops</h3><p>${e.limits}</p></div><div class="method-box"><h3>Implementation & checks</h3><p>${e.engineering}</p><p><a href="https://github.com/thetarocks/catalyst-lab/blob/main/experiments/models.mjs">Read the model kernels ↗</a> · <a href="https://github.com/thetarocks/catalyst-lab/blob/main/experiments/models.test.mjs">Inspect the numerical tests ↗</a></p></div><div class="method-box"><h3>Reading behind the model</h3><ul>${e.sources.map(([l, u]) => `<li><a href="${u}">${l} ↗</a></li>`).join("")}</ul><p class="small">These are educational implementations of established models. Outputs are synthetic scenario results, not empirical findings or trading recommendations.</p></div><p><a href="#">← Back to the experiment notebook</a></p></section></article>`;
  const form = main.querySelector("form"),
    status = document.querySelector("#status");
  function apply(p) {
    for (const [key, v] of Object.entries(p))
      if (form.elements.namedItem(key)) form.elements.namedItem(key).value = v;
    outputs();
  }
  function outputs() {
    e.controls.forEach((c) => {
      if (!c.options)
        document.querySelector(`#out-${c.key}`).textContent = fmt(
          Number(form.elements.namedItem(c.key).value),
        );
    });
  }
  function paramsFromForm() {
    const q = new URLSearchParams(new FormData(form));
    return readParams(e, q);
  }
  function run() {
    try {
      const p = paramsFromForm();
      apply(p);
      const start = performance.now(),
        r = models[id](p);
      activeResult = r;
      activeParams = p;
      document.querySelector("#results").innerHTML =
        `<div class="metrics">${r.metrics.map((m) => `<div><div class="metric-label">${m.label}</div><div class="metric-value">${fmt(m.value)}<span>${m.unit}</span></div><p class="metric-note">${m.note}</p></div>`).join("")}</div><p class="insight">${r.insight}</p>${r.network ? network(r.network) : ""}${r.charts.map(chart).join("")}<details open><summary>${id === "orderbook" ? "Execution ledger" : "Model ledger"}</summary><table><thead><tr><th>Quantity</th><th>Value</th></tr></thead><tbody>${r.rows.map(([label, value]) => `<tr><th scope="row">${esc(label)}</th><td>${fmt(value)}</td></tr>`).join("")}</tbody></table></details><p class="small">Model version 1 · seed ${p.seed} · Run inputs are included in every export.</p>`;
      status.textContent = `Completed · seed ${p.seed} · ${Math.round(performance.now() - start)} ms`;
      history.replaceState(null, "", `#${id}?${new URLSearchParams(p)}`);
    } catch (err) {
      status.textContent =
        "The experiment could not run. Reset the inputs and try again.";
      status.classList.add("error");
      console.error(err);
    }
  }
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    run();
  });
  form.addEventListener("input", () => {
    outputs();
    status.textContent =
      "Inputs changed. Run the experiment to update results.";
  });
  form.querySelectorAll("[data-preset]").forEach((b) =>
    b.addEventListener("click", () => {
      apply(e.presets[Number(b.dataset.preset)][1]);
      run();
    }),
  );
  document.querySelector("#reset").onclick = () => {
    apply(readParams(e, new URLSearchParams()));
    run();
  };
  document.querySelector("#share").onclick = async () => {
    const url = location.href;
    try {
      await navigator.clipboard.writeText(url);
      status.textContent =
        "Run link copied. It includes the last completed run’s inputs and seed.";
    } catch {
      document.querySelector("#share-fallback").innerHTML =
        `<label class="small" for="run-link">Copy this completed run link</label><input class="share-field" id="run-link" readonly value="${esc(url)}">`;
      document.querySelector("#run-link").select();
    }
  };
  document.querySelector("#json").onclick = () =>
    download(
      "json",
      JSON.stringify(
        {
          modelVersion: 1,
          experiment: id,
          parameters: activeParams,
          metrics: activeResult.metrics,
          results: activeResult.raw,
        },
        null,
        2,
      ),
    );
  document.querySelector("#csv").onclick = () => {
    const lines = [
      [
        "model_version",
        "experiment",
        "seed",
        "section",
        "series_or_metric",
        "x_or_label",
        "value",
      ],
      ...Object.entries(activeParams).map(([k, v]) => [
        1,
        id,
        activeParams.seed,
        "parameters",
        k,
        "",
        v,
      ]),
      ...activeResult.metrics.map((m) => [
        1,
        id,
        activeParams.seed,
        "metrics",
        m.label,
        m.unit,
        m.value,
      ]),
      ...activeResult.rows.map(([l, v]) => [
        1,
        id,
        activeParams.seed,
        "ledger",
        "",
        l,
        v,
      ]),
      ...activeResult.charts.flatMap((c) =>
        c.series.flatMap((s) =>
          s.points.map(([x, y]) => [
            1,
            id,
            activeParams.seed,
            c.title,
            s.name,
            x,
            y,
          ]),
        ),
      ),
    ];
    download(
      "csv",
      lines
        .map((row) =>
          row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","),
        )
        .join("\n"),
    );
  };
  apply(params);
  run();
}
function download(ext, content) {
  const a = document.createElement("a"),
    url = URL.createObjectURL(
      new Blob([content], {
        type: ext === "json" ? "application/json" : "text/csv;charset=utf-8",
      }),
    );
  a.href = url;
  a.download = `catalyst-${activeId}-seed-${activeParams.seed}.${ext}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function route() {
  const [id, q = ""] = location.hash.slice(1).split("?");
  if (Object.hasOwn(experiments, id)) detail(id, new URLSearchParams(q));
  else index();
}
window.addEventListener("hashchange", () => {
  route();
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
});
route();

// A skip link moves focus without changing the experiment route.
document.querySelector(".skip").addEventListener("click", (event) => {
  event.preventDefault();
  main.focus({ preventScroll: true });
  main.scrollIntoView({ behavior: "instant" });
});
