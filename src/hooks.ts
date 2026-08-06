import {
  BasicBetterAuthorsFactory,
  UIBetterAuthorsFactory,
} from "./modules/betterAuthors";
import { initLocale } from "./utils/locale";
import { registerPrefsScripts } from "./modules/preferenceScript";
import { createZToolkit } from "./utils/ztoolkit";
import { affiliationService } from "./affiliations/services/enrichmentService";
import { registerAffiliationColumn } from "./affiliations/ui/columns";
import { registerAffiliationMenus } from "./affiliations/ui/menu";
import { registerJournalAbbreviationColumn } from "./journals/ui/column";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  initLocale();

  // Register prefs
  BasicBetterAuthorsFactory.registerPrefs();

  await affiliationService.init();
  addon.api.affiliations = affiliationService;

  // Register extra column for item tree
  await UIBetterAuthorsFactory.registerExtraColumn();
  await registerAffiliationColumn();
  await registerJournalAbbreviationColumn();

  await Promise.all(
    Zotero.getMainWindows().map((win) => onMainWindowLoad(win)),
  );
}

async function onMainWindowLoad(win: Window): Promise<void> {
  // Create ztoolkit for every window
  addon.data.ztoolkit = createZToolkit();
  registerAffiliationMenus();
}

async function onMainWindowUnload(win: Window): Promise<void> {
  ztoolkit.unregisterAll();
}

function onShutdown(): void {
  void affiliationService.shutdown();
  ztoolkit.unregisterAll();
  // Remove addon object
  addon.data.alive = false;
  // @ts-expect-error - Plugin instance is not typed
  delete Zotero[addon.data.config.addonInstance];
}

/**
 * This function is just an example of dispatcher for Preference UI events.
 * Any operations should be placed in a function to keep this funcion clear.
 * @param type event type
 * @param data event data
 */
async function onPrefsEvent(type: string, data: { [key: string]: any }) {
  switch (type) {
    case "load":
      registerPrefsScripts(data.window);
      break;
    default:
      return;
  }
}

// Add your hooks here. For element click, etc.
// Keep in mind hooks only do dispatch. Don't add code that does real jobs in hooks.
// Otherwise the code would be hard to read and maintain.

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onPrefsEvent,
};
