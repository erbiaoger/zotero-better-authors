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
    width: "220px",
    dataProvider: (item) => {
      if (!(item instanceof Zotero.Item)) return "";
      const record = affiliationService.getFirstAuthorRecordForItem(item);
      const first = record?.authorships.find((a) => a.authorPosition === "first") || record?.authorships[0];
      return formatInstitutionColumn(first?.institutions || []);
    },
    renderCell: (_index, data, _column, _first, doc) => {
      const element = doc.createElement("span");
      element.textContent = data;
      element.setAttribute("title", data);
      return element;
    },
  });
  registered = true;
}
