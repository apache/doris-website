---
{
  "title": "ICEBERG_META",
  "description": "icebergmeta table-valued-function(tvf)は、icebergメタデータの読み取り、操作履歴、tableのスナップショット、ファイルメタデータなどに使用されます。",
  "language": "ja"
}
---
## デスクリプション

iceberg_meta table値関数（tvf）は、icebergメタデータ、操作履歴、tableのスナップショット、ファイルメタデータなどを読み取るために使用します。

## Syntax

```sql
ICEBERG_META(
    "table" = "<table>", 
    "query_type" = "<query_type>"
  );
```
## 必須パラメータ
`iceberg_meta`Table関数（tvf）の各パラメータは`"key"="value"`のペアです。

| フィールド | 説明 |
|------------|------|
| `<table>` | 表示したいIcebergTableの完全なTable名。`database_name.table_name`の形式で指定する必要があります。 |
| `<query_type>` | 表示したいメタデータのタイプ。サポートされるタイプ：<br/>`snapshots`：スナップショット情報<br/>`manifests`：現在のスナップショットのマニフェストファイル<br/>`all_manifests`：すべての有効なスナップショットのマニフェストファイル（バージョン4.0.4からサポート）<br/>`files`：現在のスナップショットのファイル情報<br/>`data_files`：現在のスナップショットのデータファイル<br/>`delete_files`：現在のスナップショットの削除ファイル<br/>`partitions`：パーティション情報<br/>`refs`：参照情報（ブランチとタグ）<br/>`history`：履歴レコード<br/>`metadata_log_entries`：メタデータログエントリ |

## 例

- スナップショット用のicebergTableメタデータを読み取ってアクセスします。

    ```sql
    select * from iceberg_meta("table" = "ctl.db.tbl", "query_type" = "snapshots");
    ```
`desc function`と組み合わせて使用できます：

    ```sql
    desc function iceberg_meta("table" = "ctl.db.tbl", "query_type" = "snapshots");
    ```
- icebergTableのスナップショットを検査する：

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
- snapshot_id でフィルタリング：

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
- icebergTableのマニフェストを表示する（現在のスナップショットのマニフェストファイル）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "manifests");
    ```
- icebergTableのall_manifestsを表示する（すべての有効なスナップショットのmanifestファイル、バージョン4.0.4からサポート）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "all_manifests");
    ```
- iceberg Tableのファイルを表示する（現在のスナップショットのファイル情報）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "files");
    ```
- iceberg Tableの data_files を表示（現在のスナップショットのデータファイル）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "data_files");
    ```
- icebergTableのdelete_filesを表示する（現在のスナップショットの削除ファイル）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "delete_files");
    ```
- iceberg Tableのパーティションを表示する

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "partitions");
    ```
- iceberg Tableの View refs（参照情報）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "refs");
    ```
- iceberg Tableの履歴を表示する

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "history");
    ```
- icebergTableのmetadata_log_entriesを表示する

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "metadata_log_entries");
    ```
## Related

IcebergシステムTableに関するより詳細な情報については、Iceberg カタログ システム Tablesを参照してください。
