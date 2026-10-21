import { runFixtures } from "./fixtures.mjs";
export function mountInvariantSuite(host) {
  host.innerHTML =
    '<details class="invariant-panel"><summary>Inspect the invariant suite <span class="suite-badge"></span></summary><div class="suite-content"><p class="suite-scope">Executed in this browser on small teaching fixtures. These checks do not prove DSIC, quota monotonicity or equivalence to official JoSAA rules.</p><ol class="suite-rows"></ol><button type="button" class="suite-run">Run browser fixtures again</button><p class="suite-status" role="status"></p><p class="suite-links"><a href="https://github.com/thetarocks/catalyst-lab/blob/main/allocation/fixtures.mjs">Browser assertions ↗</a> · <a href="https://github.com/thetarocks/catalyst-lab/tree/main/tests">Python tests ↗</a> · <a href="https://github.com/thetarocks/catalyst-lab/actions/workflows/validate.yml">Live CI ↗</a></p><p class="suite-scope">Separate Python evidence: 0 profitable deviations across 1,080 tested reports in one synthetic market. Single-round applicant DSIC is established theory; a finite audit is not its proof.</p></div></details>';
  const rows = host.querySelector(".suite-rows"),
    status = host.querySelector(".suite-status"),
    badge = host.querySelector(".suite-badge"),
    button = host.querySelector("button");
  const render = () => {
    const results = runFixtures();
    rows.replaceChildren(
      ...results.map((r) => {
        const li = document.createElement("li"),
          label = document.createElement("strong"),
          detail = document.createElement("span");
        li.className = r.passed ? "pass" : "fail";
        label.textContent = `${r.passed ? "✓" : "×"} ${r.name}`;
        detail.textContent = r.passed ? r.scope : r.error;
        li.append(label, detail);
        return li;
      }),
    );
    const passed = results.filter((r) => r.passed).length;
    badge.textContent = `${passed}/${results.length} browser fixtures passed`;
    status.textContent =
      "Executed locally in this browser. Inspect the assertions and their scope.";
  };
  button.addEventListener("click", () => {
    button.disabled = true;
    render();
    status.textContent = `Re-run completed at ${new Date().toLocaleTimeString()}.`;
    button.disabled = false;
  });
  render();
}
