(function () {
  const api = Zotero.betterauthors && Zotero.betterauthors.api.affiliations;
  const queue = document.getElementById("queue");
  function row(candidate) {
    const item = document.createXULElement("richlistitem"); item.setAttribute("flex", "1");
    const box = document.createXULElement("hbox"); box.setAttribute("flex", "1");
    const label = document.createXULElement("label"); label.setAttribute("flex", "1"); label.setAttribute("value", `${candidate.identity.title} — ${candidate.identity.firstAuthor}\n${candidate.institutions.map((i) => i.name).join(", ") || "无机构"}（${candidate.score.toFixed(3)}）`); box.appendChild(label);
    const accept = document.createXULElement("button"); accept.setAttribute("label", "接受"); accept.addEventListener("command", async function () { const zoteroItem = Zotero.Items.get(candidate.itemID); await api.acceptReview(zoteroItem.libraryID, zoteroItem.key); Zotero.getActiveZoteroPane().selectItem(zoteroItem.id); item.remove(); }); box.appendChild(accept); item.appendChild(box); return item;
  }
  async function render() { const candidates = api ? api.getReviewCandidates() : []; document.getElementById("summary").value = `待审核 ${candidates.length} 条`; candidates.forEach((candidate) => queue.appendChild(row(candidate))); }
  render();
}());
