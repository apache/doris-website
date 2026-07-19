---
{
    "title": "Parquet | File Format",
    "language": "zh-CN",
    "description": "如何将 Parquet 文件导入 Apache Doris？支持 Stream Load、Broker Load 与 S3/HDFS TVF 等方式，本文提供完整示例。",
    "keywords": [
        "Doris Parquet 导入",
        "Parquet 文件格式",
        "Stream Load Parquet",
        "Broker Load Parquet",
        "S3 TVF",
        "HDFS TVF",
        "列式存储导入"
    ],
    "sidebar_label": "Parquet"
}
---

<!-- 知识类型: 操作步骤 / 文件格式参考 -->
<!-- 适用场景: 数据导入 / 文件格式适配 -->

本文介绍如何在 Apache Doris 中导入 Parquet 格式的数据文件，并针对不同导入入口提供可直接复用的示例。

## 适用场景

Parquet 是一种列式存储格式，常用于离线数仓与对象存储中的批量数据落盘。以下场景适合使用 Parquet 作为导入源：

- 从 S3、HDFS 等对象存储/分布式文件系统批量导入历史数据。
- 通过 Stream Load 推送本地或服务端生成的 Parquet 文件。
- 通过 Broker Load 批量加载存储在远端的 Parquet 文件。
- 通过表值函数（TVF）按需查询并写入对象存储/HDFS 中的 Parquet 数据。

## 支持的导入方式

下表汇总了支持 Parquet 格式的导入方式及其典型用途：

| 导入方式 | 适用场景 | 文档链接 |
| --- | --- | --- |
| Stream Load | 本地或服务端文件的实时/批量推送 | [Stream Load](../import-way/stream-load-manual.md) |
| Broker Load | 远端存储（HDFS、对象存储）批量导入 | [Broker Load](../import-way/broker-load-manual.md) |
| INSERT INTO FROM S3 TVF | 直接查询 S3 上的 Parquet 文件并写入目标表 | [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) |
| INSERT INTO FROM HDFS TVF | 直接查询 HDFS 上的 Parquet 文件并写入目标表 | [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) |

## 使用示例

本节按照导入方式分别给出最小可执行示例。请将示例中的占位符（如 `<user>`、`<fe_host>`、`bucket` 等）替换为实际环境的值。

### 1. Stream Load 导入 Parquet

通过 HTTP 接口将本地 Parquet 文件直接推送到 Doris 表，需在请求头中显式声明 `format: parquet`。

```shell
curl --location-trusted -u <user>:<passwd> \
    -H "format: parquet" \
    -T example.parquet \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```

说明：

- `-H "format: parquet"`：声明导入文件为 Parquet 格式。
- `-T example.parquet`：指定要上传的本地 Parquet 文件。
- URL 中的 `example_db` 与 `example_table` 分别为目标数据库与目标表。

### 2. Broker Load 导入 Parquet

适用于从对象存储或 HDFS 批量加载 Parquet 文件，使用 `FORMAT AS "parquet"` 指定文件格式。

```sql
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/example.parquet")
    INTO TABLE example_table
    FORMAT AS "parquet"
)
WITH S3 
(
    ...
);
```

说明：

- `DATA INFILE`：指定 Parquet 文件的远端路径，可使用 `s3://`、`hdfs://` 等协议。
- `FORMAT AS "parquet"`：声明源文件为 Parquet 格式。
- `WITH S3 (...)`：填写访问对象存储所需的认证信息（如 `endpoint`、`access_key`、`secret_key` 等）。

### 3. TVF 导入 Parquet

通过表值函数（TVF）配合 `INSERT INTO ... SELECT` 直接读取远端 Parquet 文件并写入目标表，适用于按需导入与即席分析后落盘的场景。

```sql
INSERT INTO example_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.parquet",
    "format" = "parquet",
    ...
);
```

说明：

- `S3(...)`：表值函数，参数中需指定 `uri` 与 `format`，其他参数（如鉴权信息）按需补充。
- 将 `S3` 替换为 `HDFS` 即可读取 HDFS 上的 Parquet 文件。
- `SELECT *` 可替换为字段列表或带过滤条件的查询，实现按需导入。

## FAQ

**Q1：导入 Parquet 时需要显式指定文件格式吗？**

需要。Stream Load 通过请求头 `format: parquet` 指定；Broker Load 通过 `FORMAT AS "parquet"` 指定；TVF 通过参数 `"format" = "parquet"` 指定。

**Q2：是否支持从 HDFS 导入 Parquet？**

支持。可使用 Broker Load（在 `DATA INFILE` 中填写 `hdfs://` 路径）或 HDFS TVF 实现。

**Q3：TVF 导入和 Broker Load 有什么区别？**

Broker Load 是异步批量导入作业，适合大批量、定时任务；TVF 通过 `INSERT INTO ... SELECT` 同步执行，适合按需导入与导入前进行过滤、聚合等加工的场景。
