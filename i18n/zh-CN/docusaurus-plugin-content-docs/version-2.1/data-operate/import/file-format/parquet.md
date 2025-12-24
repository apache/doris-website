---
{
    "title": "Parquet",
    "language": "zh-CN",
    "description": "本文介绍如何在 Doris 中导入 Parquet 格式的数据文件。"
}
---

本文介绍如何在 Doris 中导入 Parquet 格式的数据文件。

## 支持的导入方式

以下导入方式支持 Parquet 格式的数据导入：

- [Stream Load](../import-way/stream-load-manual.md)
- [Broker Load](../import-way/broker-load-manual.md)
- [INSERT INTO FROM S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs)

## 使用示例

本节展示了不同导入方式下的 Parquet 格式使用方法。

### Stream Load 导入

```shell
curl --location-trusted -u <user>:<passwd> \
    -H "format: parquet" \
    -T example.parquet \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```

### Broker Load 导入

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

### TVF 导入

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