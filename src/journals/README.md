# 期刊简称列

`abbreviation.ts` 提供同步、离线的最简期刊简称计算，供 Zotero 条目列表列读取。它不会修改 `publicationTitle` 或 `journalAbbreviation` 字段，也不会在列表滚动时联网。

规则按优先级执行：

1. 使用内置常见期刊映射，例如 `Journal of Geophysical Research` → `JGR`；
2. 使用 Zotero 已有的 `journalAbbreviation`，并压缩常见点号形式；
3. 对未知刊名生成确定性的首字母简称。

`ui/column.ts` 注册“期刊简称（最简）”列。该列是插件独立列，用户可以像普通 Zotero 列一样拖动和调整宽度。
