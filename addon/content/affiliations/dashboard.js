(function () {
  const api = (typeof Zotero !== "undefined" && Zotero.betterauthors && Zotero.betterauthors.api.affiliations) || null;
  const scope = window.arguments && window.arguments[0] ? window.arguments[0] : { kind: "library" };
  function el(name, text) { const node = document.createElementNS("http://www.w3.org/1999/xhtml", name); if (text !== undefined) node.textContent = text; return node; }
  async function render() {
    if (!api) return;
    const data = await api.getDashboardData({ scope, fullCount: true, deduplicate: true, mergeParents: true });
    document.getElementById("coverage").value = `覆盖 ${data.coverage.matched}/${data.coverage.totalRecords}，待审核 ${data.coverage.needsReview}，无坐标机构 ${data.coverage.noCoordinates}`;
    const ranking = document.getElementById("ranking"); ranking.replaceChildren(el("h3", "Top institutions"));
    data.institutions.slice(0, 30).forEach((institution, index) => { const row = el("label", `${index + 1}. ${institution.name}  ${institution.count.toFixed(2)}`); row.style.fontFamily = "Times New Roman"; ranking.appendChild(row); });
    const countries = document.getElementById("countries"); countries.replaceChildren(el("h3", "国家"));
    data.countries.slice(0, 30).forEach((country) => countries.appendChild(el("label", `${country.countryCode}  ${country.count.toFixed(2)}`)));
    const map = document.getElementById("map"); map.replaceChildren(el("h3", "机构坐标")); const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 720 360"); svg.style.background = "#eef3f7"; data.institutions.filter((i) => Number.isFinite(i.latitude) && Number.isFinite(i.longitude)).forEach((i) => { const c = document.createElementNS("http://www.w3.org/2000/svg", "circle"); c.setAttribute("cx", String((i.longitude + 180) * 2)); c.setAttribute("cy", String((90 - i.latitude) * 2)); c.setAttribute("r", String(Math.max(2, Math.min(12, Math.sqrt(i.count) * 2)))); c.setAttribute("fill", "#2b6cb0"); c.setAttribute("title", i.name); svg.appendChild(c); }); map.appendChild(svg);
  }
  document.getElementById("refresh").addEventListener("command", render); render();
  document.getElementById("export").addEventListener("command", async function () { if (!api) return; const data = await api.getDashboardData({ scope }); const csv = ["institution,count,country"].concat(data.institutions.map((i) => `${JSON.stringify(i.name)},${i.count},${i.countryCode || ""}`)).join("\n"); const prompt = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService); prompt.alert(window, "CSV", csv); });
}());
