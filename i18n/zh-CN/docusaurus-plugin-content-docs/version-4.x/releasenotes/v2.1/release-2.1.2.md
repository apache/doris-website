---
{
    "title": "Release 2.1.2",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，Apache Doris 2.1.2 版本已于 2024 年 4 月 12 日正式发布。该版本提交了若干改进项以及问题修复，进一步提升了系统的性能及稳定性，欢迎大家下载体验。"
}
---

亲爱的社区小伙伴们，**Apache Doris 2.1.2 版本已于 2024 年 4 月 12 日正式发布**。该版本提交了若干改进项以及问题修复，进一步提升了系统的性能及稳定性，欢迎大家下载体验。

**官网下载：** https://doris.apache.org/download/

**GitHub 下载：** https://github.com/apache/doris/releases

## 1 行为变更

1. 将 EXPORT 命令中 `data_consistence` 属性的默认值调整为 Partition，这可以使得并发导入的同时做 EXPORT 操作更容易成功。

- https://github.com/apache/doris/pull/32830

2. 兼容部分 MySQL Connector（如 MySQL.Data for .NET）将 SELECT `@``@autocommit` 的返回值类型变更为 BIGINT。

- https://github.com/apache/doris/pull/33282 

3. Auto Partition 语法变化，详见[文档](../../table-design/data-partitioning/auto-partitioning.md)

- https://github.com/apache/doris/pull/32737

4. Auto Partition 禁止和 Dynamic Partition 同时作用在一张表上

- https://github.com/apache/doris/pull/33736

## 2 升级问题

1. 修复正常 Workload Group 从 2.0 或者更早版本升级到 2.1 时没有默认创建的问题。

- https://github.com/apache/doris/pull/33197

## 3 新功能

1. 增加 processlist 系统表功能，用户可以通过查询系统表获得活跃的链接信息。

- https://github.com/apache/doris/pull/32511

2. 增加新的表函数 `LOCAL` 以访问部分共享存储上的文件。

- https://github.com/apache/doris-website/pull/494

## 4 改进与优化

1. 跳过部分不必要检查，加速在 K8s 环境下优雅退出的速度。

- https://github.com/apache/doris/pull/33212

2. 在 Profile 中增加已命中的物化视图信息，能够方便地定位物化视图是否命中。

- https://github.com/apache/doris/pull/33137

3. 针对 DB2 Catalog，增加测试链接是否通畅的功能，能够在建立 Catalog 时做部分链接检查。 

- https://github.com/apache/doris/pull/33335

4. 增加 DNS Cache，解决 K8s 环境下域名解析较慢，从而影响查询的问题。

- https://github.com/apache/doris/pull/32869 

5. 增加异步刷新 Catalog 中表的行数信息，避免查询抖动。

- https://github.com/apache/doris/pull/32997

## 5 Bug 修复

1. 修复 Iceberg Catalog 中，不支持 Iceberg 自定义属性的问题，例如 "io.manifest.cache-enabled"。 

- https://github.com/apache/doris/pull/33113

2. `LEAD`/`LAG` 函数的 Offset 起始位置可以设置为 0。

- https://github.com/apache/doris/pull/33174

3. 修复部分导入过程中可能出现的 Timeout 的问题。

- https://github.com/apache/doris/pull/33077 

- https://github.com/apache/doris/pull/33260

4. 修复部分 `ARRAY` / `MAP` / `STRUCT` 类型在 Compaction 中引起 Core 的问题。

- https://github.com/apache/doris/pull/33130 https://github.com/apache/doris/pull/33295

5. 修复查询过程中 Runtime Filter 部分等待超时的问题。

- https://github.com/apache/doris/pull/33369

6. 修复 `unix_timestamp` 函数在 Auto Partition 中可能导致 Core 的问题。

- https://github.com/apache/doris/pull/32871

