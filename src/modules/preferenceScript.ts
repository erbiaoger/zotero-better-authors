import { config } from "../../package.json";
import { UIBetterAuthorsFactory } from "./betterAuthors";

const EXAMPLE_AUTHOR_LIST: _ZoteroTypes.Item.Creator[] = [
  {
    creatorTypeID: 8,
    fieldMode: 0,
    firstName: "Alice",
    lastName: "Adams",
  },
  {
    creatorTypeID: 8,
    fieldMode: 0,
    firstName: "Bob",
    lastName: "Brown",
  },
  {
    creatorTypeID: 8,
    fieldMode: 0,
    firstName: "三",
    lastName: "张",
  },
  {
    creatorTypeID: 8,
    fieldMode: 0,
    firstName: "四",
    lastName: "李",
  },
];

export async function registerPrefsScripts(_window: Window) {
  // This function is called when the prefs window is opened
  addon.data.prefs = {
    window: _window,
  };
  bindPrefEvents(_window.document);
  refreshPrefsUI(_window.document);
}

function getPrefsPane(doc: Document) {
  return doc.getElementById(`zotero-prefpane-${config.addonRef}`);
}

function bindPrefEvents(doc: Document) {
  const prefsPane = getPrefsPane(doc);
  if (!prefsPane) {
    return;
  }
  if (prefsPane.getAttribute("data-betterauthors-bound") === "true") {
    return;
  }

  prefsPane.setAttribute("data-betterauthors-bound", "true");

  const settingsElementsList = prefsPane.querySelectorAll("[preference]");
  const refresh = () => refreshPrefsUI(doc);

  for (const element of settingsElementsList) {
    if (!element) {
      continue;
    }
    element.addEventListener("command", refresh);
    element.addEventListener("change", refresh);
    element.addEventListener("input", refresh);
  }
}

function refreshPrefsUI(doc: Document) {
  updateFirstAuthorsSettingsUI(doc);
  updateAuthorsPreview(doc);
}

function updateFirstAuthorsSettingsUI(doc: Document) {
  const firstNAuthorsInput = doc.getElementById(
    `zotero-prefpane-${config.addonRef}-first_n_authors`,
  );
  if (!firstNAuthorsInput) {
    return;
  }

  const enabled = Boolean(
    Zotero.Prefs.get(
      `${config.prefsPrefix}.include-firstauthors-in-list`,
      true,
    ),
  );
  firstNAuthorsInput.toggleAttribute("disabled", !enabled);
}

function updateAuthorsPreview(doc: Document) {
  const previewElement = doc.getElementById(
    `zotero-prefpane-${config.addonRef}-authors-format-preview`,
  );
  if (!previewElement) {
    return;
  }

  previewElement.textContent =
    UIBetterAuthorsFactory.displayCreators(EXAMPLE_AUTHOR_LIST);
}
