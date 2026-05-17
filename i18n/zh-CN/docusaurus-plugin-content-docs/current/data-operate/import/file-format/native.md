---
{
    "title": "Native",
    "language": "zh-CN",
    "description": "如何在 Apache Doris 中导入 Native 格式数据，适用于 Doris 内部数据交换与备份场景，提供最高导入效率。",
    "keywords": [
        "Doris Native 格式",
        "Native 导入",
        "Stream Load Native",
        "Broker Load Native",
        "Doris 内部数据交换",
        "Doris 备份格式"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: Doris 内部数据流转 / 备份恢复 -->

本文介绍如何在 Apache Doris 中导入 **Native** 格式的数据文件。Native 是 Doris 专用的二进制数据格式，适合作为 **内部数据交换与备份格式**，而非通用文件交换格式。当数据仅在 Doris 内部流转时，应优先选择 Native 格式以获得最高的导入效率。

> 该功能自 4.1.0 版本支持。

## 适用场景

Native 格式主要面向以下场景：

- **Doris 集群间数据迁移**：在不同 Doris 集群间高效传输数据。
- **数据备份与恢复**：将 Doris 表数据导出为 Native 文件后归档保存，需要时再导入。
- **批量数据交换**：在 Doris 内部链路中以最高效率搬运大批量数据。

> 提示：如果需要与外部系统交换数据，请使用 CSV、JSON、Parquet、ORC 等通用格式，而非 Native。

## 支持的导入方式

下表列出了支持 Native 格式的导入方式及其典型用途：

| 导入方式 | 典型用途 | 文档链接 |
| --- | --- | --- |
| Stream Load | 通过 HTTP 推送本地 Native 文件 | [Stream Load](../import-way/stream-load-manual.md) |
| Broker Load | 从对象存储 / HDFS 异步加载 Native 文件 | [Broker Load](../import-way/broker-load-manual.md) |
| INSERT INTO FROM S3 TVF | 通过 SQL 从 S3 直接读取 Native 文件 | [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) |
| INSERT INTO FROM HDFS TVF | 通过 SQL 从 HDFS 直接读取 Native 文件 | [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) |

## 使用示例

以下示例展示了不同导入方式下 Native 格式的使用方法。请根据数据来源（本地文件 / 对象存储 / HDFS）以及导入模式（同步 / 异步）选择合适的方式。

### 通过 Stream Load 导入本地 Native 文件

适用场景：本地或可访问 FE HTTP 端口的服务器上有 Native 文件，需要快速同步导入。

操作步骤：

1. 准备 Native 文件 `example.native`。
2. 使用 `curl` 通过 Stream Load 接口推送，并通过请求头 `format: native` 指定格式。

```shell
curl --location-trusted -u <user>:<passwd> \
    -H "format: native" \
    -T example.native \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```

### 通过 Broker Load 从对象存储导入

适用场景：Native 文件存放在 S3（或兼容对象存储）等远端存储，需要异步批量导入。

操作要点：

- 在 `DATA INFILE` 中指定 Native 文件路径。
- 使用 `FORMAT AS "native"` 显式声明格式。
- 在 `WITH S3` 中补充访问对象存储所需的认证与连接信息。

```sql
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/example.native")
    INTO TABLE example_table
    FORMAT AS "native"
)
WITH S3 
(
    ...
);
```

### 通过 TVF 使用 INSERT INTO 导入

适用场景：希望直接以 SQL 方式读取远端 Native 文件并写入目标表，便于与查询、过滤、转换等逻辑组合。

操作要点：

- 在 TVF 参数中指定 `uri` 与 `format = "native"`。
- 通过 `INSERT INTO ... SELECT` 将读取结果写入目标表。

```sql
INSERT INTO example_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.native",
    "format" = "native",
    ...
);
```

## FAQ

**Q1：Native 格式是否可以用于和外部系统交换数据？**

不建议。Native 是 Doris 专用的二进制格式，与外部系统不兼容。跨系统的数据交换请优先选择 CSV、JSON、Parquet、ORC 等通用格式。

**Q2：为什么在 Doris 内部流转数据时推荐使用 Native 格式？**

Native 格式与 Doris 内部数据结构对齐，序列化与反序列化开销最小，因此在 Doris 集群之间或备份场景下能获得最高的导入效率。

**Q3：哪些导入方式支持 Native 格式？**

目前支持 Stream Load、Broker Load，以及 `INSERT INTO ... FROM S3 / HDFS` TVF 这几种方式，详见上文「支持的导入方式」章节。
