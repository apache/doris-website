---
{
  "title": "ICEBERG_META",
  "language": "ja",
  "description": "icebergmetaテーブル値関数(tvf)、icebergメタデータ、操作履歴、テーブルのスナップショット、ファイルメタデータなどの読み取りに使用する。"
}
---
## 説明

iceberg_meta テーブル値関数（tvf）は、icebergメタデータ、操作履歴、テーブルのスナップショット、ファイルメタデータなどを読み取るために使用します。

## 構文

```sql
ICEBERG_META(
    "table" = "<table>", 
    "query_type" = "<query_type>"
  );
```
## 必須パラメータ
`iceberg_meta`テーブル関数（tvf）の各パラメータは`"key"="value"`ペアです。

| Field        | Description                                                                                                                           |
|--------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `<table>`    | 完全なテーブル名。表示したいIcebergテーブルに対して`database_name.table_name`の形式で指定する必要があります。 |
| `<query_type>` | 表示したいメタデータのタイプ。現在は`snapshots`のみがサポートされています。                                                      |


## 例

- snapshotsのicebergタブラーメタデータを読み取りアクセスします。

    ```sql
    select * from iceberg_meta("table" = "ctl.db.tbl", "query_type" = "snapshots");
    ```
- `desc function` と組み合わせて使用できます：

    ```sql
    desc function iceberg_meta("table" = "ctl.db.tbl", "query_type" = "snapshots");
    ```
- iceberg テーブルスナップショットを検査する：

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "snapshots");
    ```
    ```text
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    |      committed_at      |  snapshot_id   |   parent_id   | operation |   manifest_list   |            summary           |
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    |  2022-09-20 11:14:29   |  64123452344   |       -1      |  append   | hdfs:/path/to/m1  | {"flink.job-id":"xxm1", ...} |
    |  2022-09-21 10:36:35   |  98865735822   |  64123452344  | overwrite | hdfs:/path/to/m2  | {"flink.job-id":"xxm2", ...} |
    |  2022-09-21 21:44:11   |  51232845315   |  98865735822  | overwrite | hdfs:/path/to/m3  | {"flink.job-id":"xxm3", ...} |
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    ```
- snapshot_id でフィルタリング済み：

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "snapshots") where snapshot_id = 98865735822;
    ```
    ```text
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    |      committed_at      |  snapshot_id   |   parent_id   | operation |   manifest_list   |            summary           |
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    |  2022-09-21 10:36:35   |  98865735822   |  64123452344  | overwrite | hdfs:/path/to/m2  | {"flink.job-id":"xxm2", ...} |
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    ```
