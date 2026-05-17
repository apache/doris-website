---
{
    "title": "ORC | File Format",
    "language": "zh-CN",
    "description": "如何在 Apache Doris 中通过 Stream Load、Broker Load 与 TVF 导入 ORC 格式数据文件，含完整示例。",
    "sidebar_label": "ORC",
    "keywords": [
        "Doris ORC 导入",
        "ORC 格式",
        "Stream Load ORC",
        "Broker Load ORC",
        "S3 TVF ORC",
        "HDFS TVF ORC",
        "Apache Doris 文件格式"
    ]
}
---

<!-- 知识类型: 操作步骤 / 配置参数 -->
<!-- 适用场景: 数据导入 / 文件格式选择 -->

本文介绍如何在 Apache Doris 中导入 ORC 格式的数据文件，包括支持的导入方式以及典型使用示例。

## 支持的导入方式

下表列出了 Doris 中可用于 ORC 格式的导入方式及其适用场景：

| 导入方式 | 适用场景 | 文档链接 |
| --- | --- | --- |
| Stream Load | 通过 HTTP 协议从本地或客户端推送 ORC 文件 | [Stream Load](../import-way/stream-load-manual.md) |
| Broker Load | 从对象存储或 HDFS 异步批量导入 ORC 文件 | [Broker Load](../import-way/broker-load-manual.md) |
| INSERT INTO FROM S3 TVF | 通过表函数读取 S3 上的 ORC 文件 | [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) |
| INSERT INTO FROM HDFS TVF | 通过表函数读取 HDFS 上的 ORC 文件 | [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) |

## 使用示例

本节按导入方式展示 ORC 格式的典型用法。所有示例均需将占位符（如 `<user>`、`<fe_host>`、`bucket`）替换为实际环境参数。

### Stream Load 导入

适用于将本地 ORC 文件通过 HTTP 推送到 Doris：

```shell
curl --location-trusted -u <user>:<passwd> \
    -H "format: orc" \
    -T example.orc \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```

关键说明：

- 通过请求头 `-H "format: orc"` 指定数据格式为 ORC。
- `-T` 指定本地待导入的 ORC 文件路径。
- URL 中需指定目标数据库与目标表。

### Broker Load 导入

适用于从对象存储（如 S3）或 HDFS 批量导入 ORC 文件：

```sql
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/example.orc")
    INTO TABLE example_table
    FORMAT AS "orc"
)
WITH S3 
(
    ...
);
```

关键说明：

- 通过 `FORMAT AS "orc"` 显式声明数据文件格式。
- `DATA INFILE` 中填写 ORC 文件的存储路径。
- `WITH S3 (...)` 中需补充对象存储的访问凭证等连接信息。

### TVF 导入

适用于通过表函数（Table-Valued Function）直接查询并写入远端 ORC 文件：

```sql
INSERT INTO example_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.orc",
    "format" = "orc",
    ...
);
```

关键说明：

- 在 TVF 参数中通过 `"format" = "orc"` 指定数据格式。
- `"uri"` 用于指定 ORC 文件在对象存储或 HDFS 中的路径。
- 可在 `SELECT` 中加入列裁剪、过滤或转换逻辑后再写入目标表。

## FAQ

**Q1：导入 ORC 文件时是否必须显式指定 `format` 参数？**

是。无论使用 Stream Load、Broker Load 还是 TVF，都需要显式声明 `format` 为 `orc`，否则会按默认格式（如 CSV）解析，导致导入失败。

**Q2：Stream Load、Broker Load 与 TVF 在导入 ORC 时如何选择？**

- 本地或客户端文件，且数据量较小：优先使用 Stream Load。
- 远端对象存储或 HDFS 上的大批量文件：优先使用 Broker Load。
- 需要在导入过程中执行列裁剪、过滤或转换：优先使用 TVF（`INSERT INTO ... SELECT FROM S3/HDFS`）。

**Q3：示例中的 `...` 表示什么？**

示例中的 `...` 为占位符，需根据实际环境补充对应的连接参数（如 S3 的 `AK/SK`、`endpoint`、`region` 等）或其他可选参数。完整参数请参考各导入方式的官方文档。
