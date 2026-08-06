function selectedItems(): Zotero.Item[] {
  const pane: any = Zotero.getActiveZoteroPane?.();
  return (pane?.getSelectedItems?.() || []) as Zotero.Item[];
}

async function setSelectedJournalAbbreviation(): Promise<void> {
  const items = selectedItems();
  const win: any = Zotero.getMainWindow();
  if (items.length !== 1) {
    win.alert("请只选择一篇文献，再手动设置期刊简称。");
    return;
  }

  const item = items[0];
  const title = String(item.getField("publicationTitle") || "未填写期刊");
  const input = { value: String(item.getField("journalAbbreviation") || "") };
  const prompt = (Components.classes as any)[
    "@mozilla.org/embedcomp/prompt-service;1"
  ].getService(Components.interfaces.nsIPromptService);
  const accepted = prompt.prompt(
    win,
    "手动设置期刊简称",
    `${title}\n请输入最简简称（留空可清除已有简称）：`,
    input,
    null,
    { value: false },
  );
  if (!accepted) return;

  item.setField("journalAbbreviation", input.value.trim());
  await item.saveTx();
  (Zotero.getActiveZoteroPane()?.itemsView as any)?.invalidate?.();
}

export function registerJournalAbbreviationMenu(): void {
  const children: any[] = [
    {
      tag: "menuitem",
      label: "手动设置期刊简称",
      commandListener: () => void setSelectedJournalAbbreviation(),
    },
  ];
  ztoolkit.Menu.register("item", {
    tag: "menu",
    id: "betterauthors-journal-menu",
    label: "期刊简称",
    children,
  });
}
