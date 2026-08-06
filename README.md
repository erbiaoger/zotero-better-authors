# Zotero Better Authors （Zotero 更好作者）

[![zotero target version](https://img.shields.io/badge/Zotero-7--9-green?style=flat-square&logo=zotero&logoColor=CC2936)](https://www.zotero.org)
[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-square&logo=github)](https://github.com/windingwind/zotero-plugin-template)

[中文说明](./docs/README_CN.md)

This is a simple plugin for [Zotero](https://www.zotero.org/) 7, 8, and 9.

## Installation

- Go to the [latest release](https://github.com/github-young/zotero-better-authors/releases/latest).
- Download the file `zotero-better-authors.xpi` by saving it as a file.
- Drag the `xpi` file into Zotero's plugin manager or use "install via file" and select the `xpi` file.

## Features

- **Second Author** Display the second author in a new column, which is often the corresponding author.
- **First Author** Display the first author in a new column.
- **Authors List** Display the authors in a new column with customizable displayed contents and styles
  - Choose whether to display: first N authors (all or partial), and the second author
  - Customize the symbol(s) to separate authors (either in one author or between authors, _e. g._ `,` `;` ` `), and to indicate the second author (_e. g._ `*` `†` `‡` `⸸`)
  - Choose the name orders for displaying authors: `Firstname Lastname`, `Lastname Firstname`, or `auto (according to the language of the authors names)`
- **First-author institutions** Manually enrich selected items or a library through OpenAlex, Crossref, and optional local GROBID. The result is shown in a synchronous item-tree column and a local institution dashboard; no network request is made while browsing or scrolling.
- **Offline institution map** Aggregate first-author institutions by country and coordinates, with full/fractional counting, conservative deduplication, and optional parent-institution merge. Chart text uses Times New Roman and no online map tiles are loaded.
- **Cross-device mirror** A single `BetterAuthors-Affiliation:` JSON line in each editable item's Extra preserves the first-author result through Zotero sync. Other Extra content is retained.
- **Chinese institution column** Optionally generate a second “第一作者机构（中文）” column. DeepSeek `deepseek-v4-flash` is called only from the explicit context-menu batch action; the API key stays local and translated names are cached.

### First-author institution setup

Open the plugin preferences and configure an OpenAlex API Key (required for enrichment), an optional Crossref polite-pool email, and the local GROBID URL. Then use the item/collection context menu `机构数据` to start a batch. The independent cache and module documentation are in [`src/affiliations/README.md`](src/affiliations/README.md).

## Usage & Screenshots

This plugin comes with a self-explanatory settings panel in Zotero settings. An example of the displayed authors and corresponding settings (with English and Chinese support) is given in the screenshot.

Displayed authors

![image](./docs/image_display.png)

Settings

![image_settings](./docs/image_settings_en.png)

## Contributing

```bash
# clone code
git clone https://github.com/github-young/zotero-better-authors.git
cd zotero-better-authors

# install deps
corepack enable
pnpm i

# config env
cp .env.example .env
vi .env

# development
pnpm start
pnpm build

# code format and lint
pnpm build
```

## Disclaimer

Use this code under AGPL. No warranties are provided. Keep the laws of your locality in mind!

If you want to change the license, please contact the original developer at <wyzlshx@foxmail.com>.
