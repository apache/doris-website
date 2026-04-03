---
{
  "title": "ICEBERG_META",
  "language": "ja",
  "description": "icebergmetaテーブル値関数(tvf)、icebergメタデータ、操作履歴、テーブルのsnapshot、ファイルメタデータ等の読み取りに使用する。"
}
---
## 説明

iceberg_meta テーブル値関数(tvf)は、icebergメタデータ、操作履歴、テーブルのスナップショット、ファイルメタデータなどの読み取りに使用します。

## 構文

```sql
ICEBERG_META(
    "table" = "<table>", 
    "query_type" = "<query_type>"
  );
```
## 必須パラメータ
`iceberg_meta`テーブル関数(tvf)の各パラメータは`"key"="value"`のペアです。

| フィールド | 説明 |
|------------|------|
| `<table>` | 完全なテーブル名。表示したいIcebergテーブルに対して`database_name.table_name`の形式で指定する必要があります。 |
| `<query_type>` | 表示したいメタデータのタイプ。サポートされるタイプ：<br/>`snapshots`: スナップショット情報<br/>`manifests`: 現在のスナップショットのManifestファイル<br/>`all_manifests`: すべての有効なスナップショットのManifestファイル（バージョン4.0.4からサポート）<br/>`files`: 現在のスナップショットのファイル情報<br/>`data_files`: 現在のスナップショットのデータファイル<br/>`delete_files`: 現在のスナップショットの削除ファイル<br/>`partitions`: パーティション情報<br/>`refs`: 参照情報（ブランチとタグ）<br/>`history`: 履歴レコード<br/>`metadata_log_entries`: メタデータログエントリ |

## 例

- スナップショット用のicebergテーブルメタデータを読み取りアクセスします。

    ```sql
    select * from iceberg_meta("table" = "ctl.db.tbl", "query_type" = "snapshots");
    ```
- `desc function` と併用できます：

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
- snapshot_id でフィルタリング:

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
- icebergテーブルのマニフェストを表示する（現在のスナップショットのマニフェストファイル）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "manifests");
    ```
- icebergテーブルのall_manifestsを表示します（すべての有効なスナップショットのマニフェストファイル、バージョン4.0.4からサポート）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "all_manifests");
    ```
- iceberg テーブルのファイルを表示（現在のスナップショットのファイル情報）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "files");
    ```
- iceberg テーブルの data_files を表示する（現在のスナップショットのデータファイル）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "data_files");
    ```
- iceberg テーブルの delete_files を表示する（現在のスナップショットの削除ファイル）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "delete_files");
    ```
- iceberg テーブルのパーティションを表示する

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "partitions");
    ```
- iceberg テーブルの ref を表示する（参照情報）

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "refs");
    ```
- iceberg テーブルの履歴を表示する

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "history");
    ```
- iceberg テーブルの metadata_log_entries を表示する

    ```sql
    select * from iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "metadata_log_entries");
    ```
## 関連

Icebergシステムテーブルに関するより詳細な情報については、[Iceberg Catalog System Tables](../../../lakehouse/catalogs/iceberg-catalog.mdx#system-tables)を参照してください。
