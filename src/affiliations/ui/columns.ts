import { config } from "../../../package.json";
import { formatInstitutionColumn } from "../extraMirror";
import { formatInstitutionChineseColumn } from "../institutionTranslation";
import { affiliationService } from "../services/enrichmentService";

let registered = false;

export async function registerAffiliationColumn(): Promise<void> {
  if (registered) return;
  const register = async (dataKey: string, label: string, formatter: (institutions: any[]) => string) => Zotero.ItemTreeManager.registerColumn({
      dataKey,
      label,
      pluginID: config.addonID,
      enabledTreeIDs: ["main"],
      flex: 0.8,
      dataProvider: (item: Zotero.Item | Zotero.Collection) => {
        // Item-tree rows can come from another Zotero window realm, so avoid
        // instanceof checks here. The synchronous column only needs getField.
        if (!item || typeof (item as any).getField !== "function") return "";
        const record = affiliationService.getFirstAuthorRecordForItem(item as Zotero.Item);
        const first = record?.authorships.find((a) => a.authorPosition === "first") || record?.authorships[0];
        return formatter(first?.institutions || []);
      },
      renderCell: (_index: number, data: string, column: any, _first: boolean, doc: Document) => {
        const element = doc.createElementNS("http://www.w3.org/1999/xhtml", "span");
        element.className = `cell ${column.className}`;
        element.innerText = data;
        element.title = data;
        return element;
      },
    });
  await register("firstauthorinstitution", "第一作者机构", formatInstitutionColumn);
  await register("firstauthorinstitutionzh", "第一作者机构（中文）", formatInstitutionChineseColumn);
  registered = true;
}
