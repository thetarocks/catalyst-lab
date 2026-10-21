import { experiments } from "./content.mjs";
import { models } from "./models.mjs";
import { topics } from "./topics.mjs";
import { mountQuickPreview } from "./quick-preview.mjs";
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
  if (c.kind !== "histogram")
    minY = minY >= 0 ? Math.max(0, minY - yPad) : minY - yPad;
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
  return `<figure class="chart"><h3>${esc(c.title)}</h3><p class="chart-hint">Swipe the chart to see the full axes, or open its data table.</p><div class="plot-scroll" tabindex="0" role="region" aria-label="${esc(c.title)} — scrollable chart">${svg}</div><figcaption class="legend">${c.series.map((s, i) => `<span><i style="background:${colors[i % colors.length]}"></i>${esc(s.name)}</span>`).join("")}</figcaption><details><summary>Read chart data (${all.length.toLocaleString()} points)</summary><div class="chart-data"><table><thead><tr><th>Series</th><th>${esc(c.x)}</th><th>${esc(c.y)}</th></tr></thead><tbody>${c.series.map((s) => s.points.map(([x, y]) => `<tr><th scope="row">${esc(s.name)}</th><td>${fmt(x)}</td><td>${fmt(y)}</td></tr>`).join("")).join("")}</tbody></table></div></details></figure>`;
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
  main.innerHTML = `<section class="hero lab-hero"><div class="hero-copy"><p class="eyebrow">A PERSONAL LAB FOR ECONOMICS + CODE</p><h1>Small rules.<br>Big <em>effects.</em></h1><p class="lede">Markets are made of decisions. Pull one thread and see what changes.</p><div class="hero-links"><a class="text-button" href="#collection" data-scroll-collection>Explore the experiments <span>↘</span></a><a href="./learn.html">Inside the maths & code ↗</a></div><p class="hero-caption">06 interactive models / Open source / Built to be questioned</p></div><div class="hero-art"><img src="./assets/systems.svg" alt="A wireframe sphere crossed by a stepped price signal, an illustration of connected economic systems." width="720" height="440"><span class="art-caption">THE WORLD, WITH A FEW VARIABLES LEFT OPEN.</span></div></section><div class="ticker" aria-label="Areas of exploration"><span>MARKETS</span><span aria-hidden="true">✳</span><span>RISK</span><span aria-hidden="true">✳</span><span>INCENTIVES</span><span aria-hidden="true">✳</span><span>CODE</span><span aria-hidden="true">↗</span></div><section class="play-band"><div><p class="eyebrow">DON’T JUST READ. CHANGE SOMETHING.</p><h2>What does a<br>trade <em>really</em> cost?</h2><p>The price on the screen is only the start. Buy more shares and watch your order walk through the available liquidity.</p><p class="small">A working preview of experiment 01. The same matching engine powers the full simulation.</p></div><aside class="quick-preview" aria-label="Try a market order"></aside></section><section class="collection-intro" id="collection"><p class="eyebrow">THE EXPERIMENT COLLECTION / 01—06</p><h2>Choose a world.<br><em>Change its rules.</em></h2><p>Start with a question. Adjust the assumptions. Inspect what the model can—and cannot—tell you.</p></section><div class="catalog-tools"><div class="filter-pills" role="group" aria-label="Filter experiments"><button type="button" data-filter="all" aria-pressed="true">All six</button><button type="button" data-filter="execution" aria-pressed="false">Market execution</button><button type="button" data-filter="risk-models" aria-pressed="false">Risk & networks</button><button type="button" data-filter="incentives" aria-pressed="false">Incentives</button></div><label class="model-search">Find a model<input id="model-search" type="search" placeholder="Search topics or methods…" autocomplete="off"></label></div><p id="filter-status" class="filter-status" role="status">6 experiments</p><p id="no-models" class="no-models" hidden>No matches. Try a different topic or clear the filters.</p>${[
    [
      "execution",
      "Market execution",
      "How trades become prices.",
      ["orderbook", "amm"],
    ],
    [
      "risk-models",
      "Risk & networks",
      "What a risk measure or a hedge can leave out.",
      ["hedge", "risk", "contagion"],
    ],
    [
      "incentives",
      "Incentives & allocation",
      "How the rules change the way people bid.",
      ["auctions"],
    ],
  ]
    .map(
      ([anchor, title, description, ids], i) =>
        `<section class="catalog-group" id="${anchor}"><div class="group-heading"><span class="serial">0${i + 1}</span><div><h2>${title}</h2><p>${description}</p></div></div><div class="catalog-grid">${ids
          .map((id) => {
            const e = experiments[id],
              t = topics[id];
            return `<article class="experiment-card" data-model="${id}"><a class="card-art" href="#${id}" tabindex="-1" aria-hidden="true"><img src="./assets/${id}.svg" width="720" height="440" alt="" loading="lazy"><span class="art-open">↗</span></a><p class="tag">EXPERIMENT ${e.no} / ${t.cs}</p><h3><a href="#${id}">${t.name} <span aria-hidden="true">↗</span></a></h3><p class="card-question">${e.question}</p><p class="card-output"><strong>Explore:</strong> ${t.explore}</p><div class="card-bottom"><a href="#${id}">Run the experiment →</a><a href="./learn.html#${id}">Understand the model</a></div></article>`;
          })
          .join("")}</div></section>`,
    )
    .join(
      "",
    )}<section class="index-note"><div><p class="section-label">How the notebook is built</p><h2>Inspect the mechanism.</h2></div><div><p>Each experiment includes explicit assumptions, a worked example, numerical checks and primary references. The <a href="./learn.html#architecture">implementation guide</a> explains the shared architecture and the algorithms inside each model.</p><p class="small">Related work: <a href="../">JoSAA allocation audit</a> · <a href="https://github.com/thetarocks/dao-sybil-resilience">DAO Sybil resilience</a></p></div></section>`;
  mountQuickPreview(main.querySelector(".quick-preview"));
  main
    .querySelector("[data-scroll-collection]")
    .addEventListener("click", (event) => {
      event.preventDefault();
      main
        .querySelector("#collection")
        .scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        });
    });
  let selectedCategory = "all";
  const search = main.querySelector("#model-search");
  function filterModels() {
    const query = search.value.trim().toLocaleLowerCase();
    let count = 0;
    main.querySelectorAll(".catalog-group").forEach((group) => {
      let visible = 0;
      group.querySelectorAll("[data-model]").forEach((card) => {
        const matches =
          (selectedCategory === "all" || group.id === selectedCategory) &&
          card.textContent.toLocaleLowerCase().includes(query);
        card.hidden = !matches;
        if (matches) {
          count++;
          visible++;
        }
      });
      group.hidden = visible === 0;
    });
    main.querySelector("#filter-status").textContent =
      `${count} experiment${count === 1 ? "" : "s"}${query ? " matching your search" : ""}`;
    main.querySelector("#no-models").hidden = count !== 0;
  }
  main.querySelectorAll("[data-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      selectedCategory = button.dataset.filter;
      main
        .querySelectorAll("[data-filter]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      filterModels();
    }),
  );
  search.addEventListener("input", filterModels);
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
  const topic = topics[id];
  activeId = id;
  document.title = `${e.title} · Your Catalyst`;
  const params = readParams(e, query);
  main.innerHTML = `<a class="back" href="#">← All experiments</a><article><header class="detail-head"><p class="eyebrow">EXPERIMENT ${e.no} / ${e.area}</p><h1>${topic.name}</h1><p class="subtitle">${e.title} · ${e.subtitle}</p><p class="question">${e.question}</p><p class="intro">${e.intro}</p><p class="detail-guide"><a href="./learn.html#${id}">Read the maths & code walkthrough ↗</a></p><div class="tags">${e.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div></header><nav class="section-nav" aria-label="On this page"><a href="#" data-section="simulator">01 / Experiment</a><a href="#" data-section="model-notes">02 / Model notes</a><a href="#" data-section="checks">03 / Code & checks</a><a href="#" data-section="references">04 / References</a></nav><section id="simulator" class="workspace" aria-label="Interactive experiment"><aside class="controls"><form><p class="section-label">The experiment</p><h2>Set the inputs.</h2><p class="help control-intro">Choose a scenario or adjust the controls, then run the model. Results stay fixed until the next run.</p>${e.controls.map(control).join("")}<div class="control"><label for="seed">Random seed</label><input id="seed" name="seed" type="number" min="0" max="4294967295" step="1" value="42"><p class="help">${id === "amm" ? "This model uses closed-form equations. The seed is recorded for consistency and does not affect the result." : "The same inputs and seed reproduce the same run."}</p></div><p class="section-label">Try a starting point</p><div class="presets">${e.presets.map(([label], i) => `<button type="button" data-preset="${i}">${label}</button>`).join("")}</div><button class="primary" type="submit">Run experiment →</button><div class="actions"><button type="button" id="reset">Reset</button><button type="button" id="share">Copy run link</button><button type="button" id="json">JSON ↓</button><button type="button" id="csv">CSV ↓</button></div><p id="status" class="status" role="status" aria-live="polite"></p><div id="share-fallback"></div></form></aside><div id="results" aria-label="Simulation results"></div></section><section id="model-notes" class="reading"><p class="eyebrow">MODEL NOTES / WHAT THE NUMBERS MEAN</p><h2>How to read this experiment.</h2><p class="reading-summary">Start with the mechanism below. For a derivation, an algorithm walkthrough and questions to test your understanding, open the <a href="./learn.html#${id}">${topic.name.toLowerCase()} guide</a>.</p>${e.story.map(([title, text], i) => `<div class="step"><span class="serial">0${i + 1}</span><div><h3>${title}</h3><p>${text}</p></div></div>`).join("")}<pre class="equation">${esc(e.formula)}</pre><h3>A small worked example</h3><p>${e.worked}</p><h2>Two things to try</h2><ul>${e.try.map((t) => `<li>${t}</li>`).join("")}</ul><div class="method-box"><h3>Where this model stops</h3><p>${e.limits}</p></div><div class="method-box" id="checks"><h3>Implementation & checks</h3><p>${e.engineering}</p><p><a href="https://github.com/thetarocks/catalyst-lab/blob/main/experiments/models.mjs">Read the model kernels ↗</a> · <a href="https://github.com/thetarocks/catalyst-lab/blob/main/experiments/models.test.mjs">Inspect the numerical tests ↗</a></p></div><div class="method-box" id="references"><h3>Reading behind the model</h3><ul>${e.sources.map(([l, u]) => `<li><a href="${u}">${l} ↗</a></li>`).join("")}</ul><p class="small">These are educational implementations of established models. Outputs are synthetic scenario results, not empirical findings or trading recommendations.</p></div><p><a href="#">← Back to the experiment notebook</a></p></section></article>`;
  main.querySelectorAll("[data-section]").forEach((link) =>
    link.addEventListener("click", (event) => {
      event.preventDefault();
      document.getElementById(link.dataset.section).scrollIntoView();
    }),
  );
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
      const r = models[id](p);
      activeResult = r;
      activeParams = p;
      document.querySelector("#results").innerHTML =
        `<div class="metrics">${r.metrics.map((m) => `<div><div class="metric-label">${m.label}</div><div class="metric-value">${fmt(m.value)}<span>${m.unit}</span></div><p class="metric-note">${m.note}</p></div>`).join("")}</div><p class="insight">${r.insight}</p>${r.network ? network(r.network) : ""}${r.charts.map(chart).join("")}<details open><summary>${id === "orderbook" ? "Execution ledger" : "Model ledger"}</summary><table><thead><tr><th>Quantity</th><th>Value</th></tr></thead><tbody>${r.rows.map(([label, value]) => `<tr><th scope="row">${esc(label)}</th><td>${fmt(value)}</td></tr>`).join("")}</tbody></table></details><p class="small">Model version 1 · seed ${p.seed} · Run inputs are included in every export.</p>`;
      status.classList.remove("error", "pending");
      status.textContent = `Results updated · seed ${p.seed}`;
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
    status.classList.add("pending");
    status.textContent =
      "Inputs changed. The results below show the previous run. Select Run experiment to update them.";
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
