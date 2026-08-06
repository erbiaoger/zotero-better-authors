# 第一作者机构模块

本目录实现 Zotero 7–9 的手动机构数据批处理。它按 `sources`（OpenAlex、Crossref、GROBID HTTP 客户端）、`parsers`（各源解析）、`storage`（独立 SQLite 与仓储）、`services`（批处理和 Extra 镜像）、`analytics`（机构/国家聚合）和 `ui`（列、右键菜单）分层。

## 使用

1. 在 Zotero 插件设置中填写 OpenAlex API Key；可选填写 Crossref 联系邮箱和 GROBID 地址。
2. 在条目列表右键选择“机构数据 → 补齐选中条目”，或选择“补齐当前文库”。插件不会在导入或滚动列表时联网。
3. 使用“打开机构地图”查看离线机构排行、国家统计和经纬度点位；地图只统计第一作者机构。

本地缓存位于 Zotero 数据目录的 `better-authors.sqlite`。可写条目会额外保存一行 `BetterAuthors-Affiliation:` 镜像，以便 Zotero 同步到另一台设备后恢复列和地图。API Key 永不写入 SQLite、Extra 或日志。远程 GROBID 只有显式传入 `allowRemoteGrobid` 才会上传本地 PDF；默认地址为 loopback。

## 数据结构

`work_cache` 保存条目指纹、状态、作者关系和过期时间；`authorships`、`institutions` 和 `authorship_institutions` 保存完整的本地作者—机构图；`jobs` 和 `manual_overrides` 为可恢复批次与后续人工锁定预留。状态包括 `queued`、`running`、`succeeded`、`needs_review`、`no_match`、`failed` 和 `cancelled`。

列渲染只读取内存 Map，不进行网络请求或 SQLite 异步查询。匹配使用 DOI 批量 OpenAlex，必要时回退 Crossref、标题候选和已有 PDF 的 GROBID；所有源调用均可在测试中替换为 fixture HTTP client。
