---
{
  "title": "ORC | ファイル形式",
  "language": "ja",
  "description": "この文書では、DorisでORC形式のデータファイルを読み込む方法について説明します。",
  "sidebar_label": "ORC"
}
---
# ORC

このドキュメントでは、DorisでORC形式のデータファイルをロードする方法について説明します。

## サポートされているロード方法

以下のロード方法でORC形式のデータをサポートしています：

- [Stream Load](../import-way/stream-load-manual.md)
- [Broker Load](../import-way/broker-load-manual.md)
- [INSERT INTO FROM S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs)

## 使用例

このセクションでは、異なるロード方法におけるORC形式の使用方法を示します。

### Stream Load

```shell
curl --location-trusted -u <user>:<passwd> \
    -H "format: orc" \
    -T example.orc \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```
### Broker負荷

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
### TVF Load

```sql
INSERT INTO example_table
SELECT *
FROM S3
(
    "path" = "s3://bucket/example.orc",
    "format" = "orc",
    ...
);
