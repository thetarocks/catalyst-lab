export const colors = [
  "#286044",
  "#b05232",
  "#436baa",
  "#8d6b13",
  "#805196",
  "#367d86",
  "#78634a",
  "#ac4676",
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
  Number(x).toLocaleString("en-US", { maximumFractionDigits: 3 });
const choices = new Map();
export function chart(c, index) {
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
  const pad = (maxY - minY) * 0.08;
  maxY += pad;
  if (c.kind !== "histogram")
    minY = minY >= 0 ? Math.max(0, minY - pad) : minY - pad;
  const W = 700,
    H = 330,
    left = 72,
    right = 24,
    top = 24,
    bottom = 62,
    px = (x) => left + ((x - minX) / (maxX - minX)) * (W - left - right),
    py = (y) => H - bottom - ((y - minY) / (maxY - minY)) * (H - top - bottom);
  let svg = `<svg viewBox="0 0 ${W} ${H}" data-min-x="${minX}" data-max-x="${maxX}" data-min-y="${minY}" data-max-y="${maxY}" role="img" aria-labelledby="chart-title-${index} chart-desc-${index}"><title id="chart-title-${index}">${esc(c.title)}</title><desc id="chart-desc-${index}">${esc(c.x)} versus ${esc(c.y)}. Inspect with the slider below, or read the full data table.</desc><defs><linearGradient id="plot-fill-${index}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8eac74" stop-opacity=".23"/><stop offset="1" stop-color="#8eac74" stop-opacity="0"/></linearGradient><clipPath id="plot-clip-${index}"><rect x="${left - 8}" y="${top - 8}" width="${W - left - right + 16}" height="${H - top - bottom + 16}"/></clipPath></defs>`;
  for (let i = 0; i <= 4; i++) {
    const v = minY + ((maxY - minY) * i) / 4,
      y = py(v),
      x = minX + ((maxX - minX) * i) / 4;
    svg += `<line x1="${left}" x2="${W - right}" y1="${y}" y2="${y}" stroke="#d9ddcf" stroke-dasharray="2 5"/><text x="${left - 12}" y="${y + 4}" text-anchor="end" font-size="11" fill="#536158">${fmt(c.kind === "histogram" ? Math.round(v) : v)}</text><text x="${px(x)}" y="${H - 39}" text-anchor="middle" font-size="11" fill="#536158">${fmt(x)}</text>`;
  }
  svg += `<g clip-path="url(#plot-clip-${index})">`;
  c.series.forEach((s, i) => {
    const color = colors[i % colors.length];
    svg += `<g data-series="${i}">`;
    if (c.kind === "histogram") {
      const width = ((W - left - right) / s.points.length) * 0.85;
      s.points.forEach(([x, y]) => {
        svg += `<rect class="plot-bar" x="${px(x) - width / 2}" y="${py(y)}" width="${width}" height="${Math.max(0, py(0) - py(y))}" rx="2" fill="${color}" opacity=".85"><title>${esc(s.name)}: ${fmt(x)}, ${fmt(y)}</title></rect>`;
      });
    } else if (s.scatter) {
      s.points.forEach(([x, y]) => {
        svg += `<circle class="plot-point" cx="${px(x)}" cy="${py(y)}" r="${s.points.length === 1 ? 7 : 2}" fill="${color}" opacity="${s.points.length === 1 ? 1 : 0.2}"><title>${esc(s.name)}: ${fmt(x)}, ${fmt(y)}</title></circle>`;
      });
    } else {
      const d = s.points
        .map(
          ([x, y], j) =>
            `${j ? "L" : "M"}${px(x).toFixed(2)},${py(y).toFixed(2)}`,
        )
        .join(" ");
      if (c.series.length === 1)
        svg += `<path class="plot-area" d="${d} L${px(s.points.at(-1)[0])},${H - bottom} L${px(s.points[0][0])},${H - bottom} Z" fill="url(#plot-fill-${index})"/>`;
      svg += `<path class="plot-line" data-line="${i}" d="${d}" fill="none" stroke="${color}" stroke-width="${s.points.length === 1 ? 4 : 2.8}" stroke-linecap="round" stroke-linejoin="round" ${i === 1 ? 'stroke-dasharray="7 5"' : ""}/>`;
    }
    svg += "</g>";
  });
  svg += `</g><g class="chart-cursor" visibility="hidden" aria-hidden="true"><line x1="${left}" x2="${left}" y1="${top}" y2="${H - bottom}" stroke="#536158" stroke-dasharray="3 4"/><g class="cursor-points"></g></g><text x="${(W + left - right) / 2}" y="${H - 9}" text-anchor="middle" font-size="12" fill="#536158">${esc(c.x)}</text><text x="17" y="${(H - bottom + top) / 2}" text-anchor="middle" transform="rotate(-90 17 ${(H - bottom + top) / 2})" font-size="11" fill="#536158">${esc(c.y)}</text></svg>`;
  return `<figure class="chart interactive-chart" data-chart="${index}"><div class="chart-heading"><span class="plot-number">FIG. ${String(index + 1).padStart(2, "0")}</span><span class="plot-kind">${c.kind === "histogram" ? "DISTRIBUTION" : c.series.some((s) => s.scatter && s.points.length > 1) ? "SCENARIO SPACE" : "TRACE"}</span></div><h3>${esc(c.title)}</h3>${c.notice ? `<p class="chart-notice">${esc(c.notice)}</p>` : ""}<div class="legend" role="group" aria-label="Visible series for ${esc(c.title)}">${c.series.map((s, i) => `<button type="button" data-toggle-series="${i}" aria-pressed="true"><i style="background:${colors[i % colors.length]}"></i>${esc(s.name)}</button>`).join("")}</div><div class="plot-scroll" tabindex="0" role="region" aria-label="${esc(c.title)} — scrollable chart">${svg}</div><div class="chart-readout" aria-live="off">Hover or tap to inspect. Use the slider below for keyboard control.</div><label class="probe-label" for="probe-${index}">Inspect chart position <span>${esc(c.x)}</span></label><input class="chart-probe" id="probe-${index}" type="range" min="0" max="1000" step="1" value="500" aria-label="Inspect ${esc(c.title)}"><p class="chart-hint">Tap a series name to show or hide it. On a small screen, swipe the plot to see its full axes.</p><details><summary>Read chart data (${all.length.toLocaleString()} points)</summary><div class="chart-data"><table><thead><tr><th>Series</th><th>${esc(c.x)}</th><th>${esc(c.y)}</th></tr></thead><tbody>${c.series.map((s) => s.points.map(([x, y]) => `<tr><th scope="row">${esc(s.name)}</th><td>${fmt(x)}</td><td>${fmt(y)}</td></tr>`).join("")).join("")}</tbody></table></div></details></figure>`;
}
export function chartShapes(root) {
  const shapes = new Map();
  root.querySelectorAll(".interactive-chart").forEach((figure) => {
    const title = figure.querySelector("h3").textContent;
    figure
      .querySelectorAll(".plot-line")
      .forEach((path) =>
        shapes.set(`${title}/${path.dataset.line}`, path.getAttribute("d")),
      );
    figure
      .querySelectorAll(".plot-bar")
      .forEach((bar, i) =>
        shapes.set(`${title}/bar/${i}`, [
          Number(bar.getAttribute("y")),
          Number(bar.getAttribute("height")),
        ]),
      );
  });
  return shapes;
}
export function mountCharts(root, charts, previous = new Map()) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.querySelectorAll(".interactive-chart").forEach((figure) => {
    const c = charts[Number(figure.dataset.chart)],
      svg = figure.querySelector("svg"),
      readout = figure.querySelector(".chart-readout"),
      probe = figure.querySelector(".chart-probe");
    const minX = Number(svg.dataset.minX),
      maxX = Number(svg.dataset.maxX),
      minY = Number(svg.dataset.minY),
      maxY = Number(svg.dataset.maxY),
      px = (x) => 72 + ((x - minX) / (maxX - minX)) * 604,
      py = (y) => 268 - ((y - minY) / (maxY - minY)) * 244;
    const hidden = new Set(
      (choices.get(c.title) || []).filter((i) => i < c.series.length),
    );
    if (hidden.size >= c.series.length) hidden.clear();
    let lastX = null,
      queued = false,
      clientX = 0;
    function inspect(x) {
      lastX = x;
      const values = c.series
        .map((s, i) => {
          if (hidden.has(i)) return null;
          const point = s.points.reduce(
            (best, p) =>
              Math.abs(p[0] - x) < Math.abs(best[0] - x) ? p : best,
            s.points[0],
          );
          return {
            name: s.name,
            x: point[0],
            y: point[1],
            color: colors[i % colors.length],
          };
        })
        .filter(Boolean);
      const cursor = figure.querySelector(".chart-cursor");
      cursor.setAttribute("visibility", "visible");
      const line = cursor.querySelector("line");
      line.setAttribute("x1", px(x));
      line.setAttribute("x2", px(x));
      cursor.querySelector(".cursor-points").innerHTML = values
        .map(
          (v) =>
            `<circle cx="${px(v.x)}" cy="${py(v.y)}" r="5" fill="${v.color}" stroke="#fffdf7" stroke-width="2"/>`,
        )
        .join("");
      readout.innerHTML = `<span class="readout-label">NEAREST SAMPLES · ${esc(c.y)}</span>${values.map((v) => `<span><i style="background:${v.color}"></i><strong>${esc(v.name)}</strong> ${fmt(v.y)} <small>at ${fmt(v.x)}</small></span>`).join("")}`;
      probe.value = Math.round(((x - minX) / (maxX - minX)) * 1000);
      probe.setAttribute(
        "aria-valuetext",
        values
          .map((v) => `${v.name}: ${fmt(v.y)}, at ${esc(c.x)} ${fmt(v.x)}`)
          .join(";"),
      );
    }
    function visibility() {
      figure.querySelectorAll("[data-toggle-series]").forEach((button) => {
        const i = Number(button.dataset.toggleSeries),
          on = !hidden.has(i);
        button.setAttribute("aria-pressed", String(on));
        figure.querySelector(`[data-series="${i}"]`).style.display = on
          ? ""
          : "none";
      });
      if (lastX !== null) inspect(lastX);
    }
    visibility();
    figure.querySelectorAll("[data-toggle-series]").forEach((button) =>
      button.addEventListener("click", () => {
        const i = Number(button.dataset.toggleSeries);
        if (hidden.has(i)) hidden.delete(i);
        else if (hidden.size < c.series.length - 1) hidden.add(i);
        else {
          readout.textContent =
            "Keep at least one series visible to inspect the chart.";
          return;
        }
        choices.set(c.title, [...hidden]);
        visibility();
      }),
    );
    const pointer = (event) => {
      clientX = event.clientX;
      if (!queued) {
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          if (!svg.isConnected) return;
          const box = svg.getBoundingClientRect(),
            u = ((clientX - box.left) / box.width) * 700;
          inspect(
            minX + Math.max(0, Math.min(1, (u - 72) / 604)) * (maxX - minX),
          );
        });
      }
    };
    svg.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "touch") pointer(event);
    });
    svg.addEventListener("pointerdown", pointer);
    probe.addEventListener("input", () =>
      inspect(minX + (Number(probe.value) / 1000) * (maxX - minX)),
    );
    if (!reduced) {
      figure.querySelectorAll(".plot-line").forEach((path) => {
        const old = previous.get(`${c.title}/${path.dataset.line}`),
          next = path.getAttribute("d"),
          a = old?.match(/-?\d+(?:\.\d+)?/g)?.map(Number),
          b = next.match(/-?\d+(?:\.\d+)?/g).map(Number);
        if (a && a.length === b.length && a.length < 3000) {
          const start = performance.now();
          function tick(time) {
            if (!path.isConnected) return;
            const t = Math.min(1, (time - start) / 420),
              ease = 1 - (1 - t) ** 3;
            path.setAttribute(
              "d",
              b
                .map(
                  (v, i) =>
                    `${i % 2 ? "" : i === 0 ? "M" : "L"}${(a[i] + (v - a[i]) * ease).toFixed(2)}${i % 2 ? " " : ","}`,
                )
                .join(""),
            );
            if (t < 1) requestAnimationFrame(tick);
            else path.setAttribute("d", next);
          }
          requestAnimationFrame(tick);
        } else
          path.animate?.([{ opacity: 0.15 }, { opacity: 1 }], {
            duration: 450,
            easing: "ease-out",
          });
      });
      figure.querySelectorAll(".plot-bar").forEach((bar, i) => {
        const to = [
          Number(bar.getAttribute("y")),
          Number(bar.getAttribute("height")),
        ];
        const from = previous.get(`${c.title}/bar/${i}`) || [to[0] + to[1], 0];
        const start = performance.now();
        function grow(time) {
          if (!bar.isConnected) return;
          const t = Math.min(1, (time - start) / 420),
            ease = 1 - (1 - t) ** 3;
          bar.setAttribute("y", from[0] + (to[0] - from[0]) * ease);
          bar.setAttribute(
            "height",
            Math.max(0, from[1] + (to[1] - from[1]) * ease),
          );
          if (t < 1) requestAnimationFrame(grow);
        }
        requestAnimationFrame(grow);
      });
      figure.querySelector(".plot-scroll").animate?.(
        [
          { opacity: 0.65, transform: "translateY(5px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 350, easing: "ease-out" },
      );
    }
  });
}
