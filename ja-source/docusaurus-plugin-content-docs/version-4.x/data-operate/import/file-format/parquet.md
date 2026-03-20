---
{
  "title": "Parquet | ファイル形式",
  "sidebar_label": "Parquet",
  "description": "この文書では、DorisでParquet形式のデータファイルを読み込む方法について説明します。",
  "language": "ja"
}
---
# Parquet

このドキュメントでは、DorisでParquet形式のデータファイルを読み込む方法について説明します。

## サポートされている読み込み方法

以下の読み込み方法でParquet形式のデータをサポートしています：

- [Stream Load](../import-way/stream-load-manual.md)
- [Broker Load](../import-way/broker-load-manual.md)
- [INSERT INTO FROM S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs)

## 使用例

このセクションでは、異なる読み込み方法でのParquet形式の使用方法を示します。

### Stream Load

```shell
curl --location-trusted -u <user>:<passwd> \
    -H "format: parquet" \
    -T example.parquet \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```
### Broker Load

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
### TVF Load

```sql
INSERT INTO example_table
SELECT *
FROM S3
(
    "path" = "s3://bucket/example.parquet",
    "format" = "parquet",
    ...
);
