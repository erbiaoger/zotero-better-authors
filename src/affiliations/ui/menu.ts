import { affiliationService } from "../services/enrichmentService";
import type { DashboardScope } from "../types";

function selectedIDs(): number[] {
  const pane: any = Zotero.getActiveZoteroPane?.();
  return (pane?.getSelectedItems?.() || []).map((item: Zotero.Item) => item.id);
}

async function runSelected(force = false): Promise<void> {
  const ids = selectedIDs();
  if (!ids.length) return Zotero.getMainWindow().alert("请先选择至少一篇顶层文献。");
  try { await affiliationService.enrichItems(ids, { force, includeGrobid: true }); (Zotero.getActiveZoteroPane()?.itemsView as any)?.invalidate?.(); }
  catch (error) { Zotero.getMainWindow().alert(String((error as Error).message || error)); }
}

function allLibraryIDs(): number[] {
  const pane: any = Zotero.getActiveZoteroPane?.();
  return pane?.getSelectedLibraryID ? [] : [];
}

export function registerAffiliationMenus(): void {
  const runCollection = async () => {
    const collection: any = Zotero.getActiveZoteroPane?.().getSelectedCollection?.();
    const ids = collection?.getChildItems?.(true, false) || [];
    if (ids.length) await affiliationService.enrichItems(ids, { force: false, includeGrobid: true });
  };
  const children: any[] = [
    { tag: "menuitem", label: "补齐选中条目", commandListener: () => void runSelected(false) },
    { tag: "menuitem", label: "强制更新选中条目", commandListener: () => void runSelected(true) },
    { tag: "menuitem", label: "补齐当前文库", commandListener: async () => { const pane: any = Zotero.getActiveZoteroPane?.(); const libraryID = pane?.getSelectedLibraryID?.(); if (libraryID) await affiliationService.enrichItems(await Zotero.Items.getAll(libraryID, true, false, true), { force: false, includeGrobid: true }); } },
    { tag: "menuitem", label: "补齐当前分类", commandListener: () => void runCollection() },
    { tag: "menuitem", label: "打开机构地图", commandListener: () => { const pane: any = Zotero.getActiveZoteroPane?.(); const collectionID = pane?.getSelectedCollection?.(true); openAffiliationDashboard(collectionID ? { kind: "collection", collectionID } : { kind: "library", libraryID: pane?.getSelectedLibraryID?.() }); } },
    { tag: "menuitem", label: "查看待审核结果", commandListener: () => openReviewQueue() },
    { tag: "menuitem", label: "清除机构数据", commandListener: async () => { if (Zotero.getMainWindow().confirm("清除当前文库的本地机构缓存？Extra 镜像不会自动删除。")) await affiliationService.clearRecords(Zotero.getActiveZoteroPane?.().getSelectedLibraryID?.()); } },
  ];
  ztoolkit.Menu.register("item", { tag: "menu", id: "betterauthors-affiliation-menu", label: "机构数据", children });
  ztoolkit.Menu.register("collection", { tag: "menu", id: "betterauthors-affiliation-collection-menu", label: "机构数据", children });
}

export function openAffiliationDashboard(scope: DashboardScope): void {
  const win: any = Zotero.getMainWindow();
  win.openDialog(`${rootURI}content/affiliations/dashboard.xhtml`, "betterauthors-affiliation-dashboard", "chrome,dialog,resizable,centerscreen", scope);
}

export function openReviewQueue(): void {
  Zotero.getMainWindow().openDialog(`${rootURI}content/affiliations/review.xhtml`, "betterauthors-affiliation-review", "chrome,dialog,resizable,centerscreen");
}
