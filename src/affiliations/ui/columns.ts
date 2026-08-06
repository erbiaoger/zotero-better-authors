import { config } from "../../../package.json";
import { formatInstitutionColumn } from "../extraMirror";
import { affiliationService } from "../services/enrichmentService";

let registered = false;

export async function registerAffiliationColumn(): Promise<void> {
  if (registered) return;
  await Zotero.ItemTreeManager.registerColumn({
    dataKey: "firstauthorinstitution",
    label: "第一作者机构",
    pluginID: config.addonID,
    enabledTreeIDs: ["main"],
    flex: 0.8,
    dataProvider: (item: Zotero.Item | Zotero.Collection) => {
      // Item-tree rows can come from another Zotero window realm, so avoid
      // instanceof checks here. The synchronous column only needs getField.
      if (!item || typeof (item as any).getField !== "function") return "";
      const record = affiliationService.getFirstAuthorRecordForItem(item as Zotero.Item);
      const first = record?.authorships.find((a) => a.authorPosition === "first") || record?.authorships[0];
      return formatInstitutionColumn(first?.institutions || []);
    },
    renderCell: (_index, data, column, _first, doc) => {
      // Zotero's item-tree renderer expects the standard `cell` class. If
      // this class is omitted, long institution names escape the cell and
      // visually cover neighbouring columns.
      const element = doc.createElementNS("http://www.w3.org/1999/xhtml", "span");
      element.className = `cell ${column.className}`;
      element.innerText = data;
      element.title = data;
      return element;
    },
  });
  registered = true;
}
