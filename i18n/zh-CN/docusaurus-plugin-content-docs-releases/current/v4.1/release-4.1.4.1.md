---
{
    "title": "Release 4.1.4.1",
    "language": "zh-CN",
    "description": "Apache Doris 4.1.4.1 版本发布说明"
}
---

Apache Doris 4.1.4.1 是基于 4.1.4 的 Hotfix 版本，包含 4.1.4 的全部内容以及以下问题修复。4.1.4 的新功能、改进与问题修复请查看 [Apache Doris 4.1.4 版本发布说明](./release-4.1.4.md)。

# 问题修复

## 查询与执行

- 修复逻辑 `OR` 处理可空的 Boolean 值时，多分支 `CASE WHEN` 等表达式导致 BE 崩溃的问题 (#68401)。

## 物化视图

- 修复基表新增分区时，分区 MTMV 执行全量刷新的问题。修复后，刷新只处理新增的分区 (#68237)。

## 导入与 Streaming Job

- 修复读取包含 `VARIANT` 列的 WAL 时，误报不支持的文件格式错误而导致读取失败的问题 (#68233)。

## 平台

- 将内置的 libunwind 从 1.6.2 升级到 1.8.3，修复 aarch64 BE 在使用 64 KiB 内存页的 Linux 系统上启动时崩溃的问题 (#68507)。
