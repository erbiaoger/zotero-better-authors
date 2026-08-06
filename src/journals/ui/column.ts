import { config } from "../../../package.json";
import { getMinimalJournalAbbreviation } from "../abbreviation";

let registered = false;

export async function registerJournalAbbreviationColumn(): Promise<void> {
  if (registered) return;
  await Zotero.ItemTreeManager.registerColumn({
    dataKey: "betterauthorsjournalabbreviation",
    label: "期刊简称（最简）",
    pluginID: config.addonID,
    enabledTreeIDs: ["main"],
    flex: 0.8,
    dataProvider: (item: Zotero.Item | Zotero.Collection) => {
      if (!item || typeof (item as any).getField !== "function") return "";
      return getMinimalJournalAbbreviation(item as Zotero.Item);
    },
    renderCell: (
      _index: number,
      data: string,
      column: any,
      _first: boolean,
      doc: Document,
    ) => {
      const element = doc.createElementNS(
        "http://www.w3.org/1999/xhtml",
        "span",
      );
      element.className = `cell ${column.className}`;
      element.innerText = data;
      element.title = data;
      return element;
    },
  });
  registered = true;
}
