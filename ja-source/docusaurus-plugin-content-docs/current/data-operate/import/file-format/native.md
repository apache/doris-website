---
{
  "title": "ネイティブ",
  "language": "ja",
  "description": "このドキュメントでは、DorisにおけるNative形式データファイルの読み込み方法について説明します。これは内部データ交換およびバックアップ形式として適しています。"
}
---
このドキュメントでは、DorisでNative形式のデータファイルを読み込む方法について説明します。これは汎用的なファイル交換形式ではなく、**内部データ交換およびバックアップ形式**として適しています。データがDoris内でのみ流通する場合は、最高の効率を達成するためにNativeを優先して使用すべきです。

## サポートされている読み込み方法

以下の読み込み方法がNative形式のデータをサポートしています：

- [Stream Load](../import-way/stream-load-manual.md)
- [Broker Load](../import-way/broker-load-manual.md)
- [INSERT INTO FROM S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs)

## 使用例

このセクションでは、異なる読み込み方法におけるNative形式の使用方法を説明します。

### Stream Load

```shell
curl --location-trusted -u <user>:<passwd> \
    -H "format: native" \
    -T example.native \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```
### Broker負荷

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
### TVF Load

```sql
INSERT INTO example_table
SELECT *
FROM S3
(
    "path" = "s3://bucket/example.native",
    "format" = "native",
    ...
);
