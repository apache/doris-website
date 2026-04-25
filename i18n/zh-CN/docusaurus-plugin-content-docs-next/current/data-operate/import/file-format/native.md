---
{
    "title": "Native",
    "language": "zh-CN",
    "description": "本文介绍如何在 Doris 中导入 Native 格式的数据文件。适合作为 内部数据交换与备份格式，而非通用文件交换格式；当你只在 Doris 内部流转数据时，应优先考虑 Native，以获得最高效率。"
}
---

本文介绍如何在 Doris 中导入 Native 格式的数据文件。适合作为 **内部数据交换与备份格式**，而非通用文件交换格式；当你只在 Doris 内部流转数据时，应优先考虑 Native，以获得最高效率。

## 支持的导入方式

以下导入方式支持 Native 格式的数据导入：

- [Stream Load](../import-way/stream-load-manual.md)
- [Broker Load](../import-way/broker-load-manual.md)
- [INSERT INTO FROM S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs)

## 使用示例

本节展示了不同导入方式下的 Native 格式使用方法。

### Stream Load 导入

```shell
curl --location-trusted -u <user>:<passwd> \
    -H "format: native" \
    -T example.native \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```

### Broker Load 导入

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

### TVF 导入

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