---
{
    "title": "ICEBERG_META",
    "language": "ja",
    "description": "iceberg_meta テーブル値関数（TVF）は、Iceberg テーブルの各種メタデータを読み取るために使用します。このテーブル関数は 4.1.4 で削除されました。代わりに Iceberg システムテーブルを使用してください。"
}
---

:::caution 動作の変更（4.1.4）

`iceberg_meta()` テーブル関数は **4.1.4** で削除されました。実行すると、次のエラーが報告されます。

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Could not find table function iceberg_meta
```

代わりに Iceberg システムテーブルを使用して、同じメタデータを問い合わせてください。システムテーブルは 3.1.0 以降でサポートされており、すべての `query_type` について `iceberg_meta()` と同じメタデータを取得できるほか、さらに多くの種類のメタデータを公開します。[Iceberg Catalog のシステムテーブル](../../../lakehouse/catalogs/iceberg-catalog.mdx#system-tables)を参照してください。

4.1.4 より前のバージョンでは引き続き `iceberg_meta()` を使用できるため、参考としてこのドキュメントに使用方法を残しています。

:::

## 説明

iceberg_meta テーブル値関数（TVF）は、Iceberg のメタデータ、操作履歴、テーブルのスナップショット、ファイルのメタデータなどを読み取るために使用します。

## 代替手段：Iceberg システムテーブル

システムテーブルには、テーブル名の末尾に `$` とシステムテーブル名を付けてアクセスします。

```sql
SELECT * FROM <catalog>.<database>.<table>$<system_table_name>;
```

各 `query_type` について、`iceberg_meta()` に対応するシステムテーブルは次のとおりです。

| `query_type`（`iceberg_meta()`） | 対応するシステムテーブル   |
|----------------------------------|---------------------------|
| `snapshots`                      | `<table>$snapshots`       |
| `manifests`                      | `<table>$manifests`       |
| `all_manifests`                  | `<table>$all_manifests`   |
| `files`                          | `<table>$files`           |
| `data_files`                     | `<table>$data_files`      |
| `delete_files`                   | `<table>$delete_files`    |
| `partitions`                     | `<table>$partitions`      |
| `refs`                           | `<table>$refs`            |
| `history`                        | `<table>$history`         |
| `metadata_log_entries`           | `<table>$metadata_log_entries` |

書き換え例：

```sql
-- Before 4.1.4
SELECT * FROM iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "snapshots");

-- 4.1.4 and later
SELECT * FROM iceberg_ctl.test_db.test_tbl$snapshots;
```

```sql
-- Before 4.1.4: filtered by the snapshot_id column
SELECT * FROM iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "snapshots")
WHERE snapshot_id = 98865735822;

-- 4.1.4 and later
SELECT * FROM iceberg_ctl.test_db.test_tbl$snapshots WHERE snapshot_id = 98865735822;
```

## 構文（4.1.4 より前）

```sql
ICEBERG_META(
    "table" = "<table>", 
    "query_type" = "<query_type>"
  );
```

## 必須パラメータ（4.1.4 より前）

`iceberg_meta` テーブル値関数（TVF）の各パラメータは、`"key"="value"` のペアです。

| フィールド   | 説明 |
|--------------|------|
| `<table>` | 参照する Iceberg テーブルの完全なテーブル名です。`database_name.table_name` の形式で指定する必要があります。 |
| `<query_type>` | 参照するメタデータの種類です。サポートされる種類：<br/>`snapshots`：スナップショット情報<br/>`manifests`：現在のスナップショットのマニフェストファイル<br/>`all_manifests`：すべての有効なスナップショットのマニフェストファイル（バージョン 4.0.4 以降でサポート）<br/>`files`：現在のスナップショットのファイル情報<br/>`data_files`：現在のスナップショットのデータファイル<br/>`delete_files`：現在のスナップショットの削除ファイル<br/>`partitions`：パーティション情報<br/>`refs`：参照情報（ブランチとタグ）<br/>`history`：履歴レコード<br/>`metadata_log_entries`：メタデータログのエントリ |

## 例

- Iceberg テーブルのスナップショットのメタデータを読み取ります。

    ```sql
    select * from iceberg_ctl.db.tbl$snapshots;
    ```

- Iceberg テーブルのスナップショットを確認します。

    ```sql
    select * from iceberg_ctl.test_db.test_tbl$snapshots;
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

- snapshot_id で絞り込みます。

    ```sql
    select * from iceberg_ctl.test_db.test_tbl$snapshots where snapshot_id = 98865735822;
    ```
    ```text
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    |      committed_at      |  snapshot_id   |   parent_id   | operation |   manifest_list   |            summary           |
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    |  2022-09-21 10:36:35   |  98865735822   |  64123452344  | overwrite | hdfs:/path/to/m2  | {"flink.job-id":"xxm2", ...} |
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    ```

- Iceberg テーブルのその他のメタデータを表示します。

    ```sql
    select * from iceberg_ctl.test_db.test_tbl$manifests;
    select * from iceberg_ctl.test_db.test_tbl$all_manifests;
    select * from iceberg_ctl.test_db.test_tbl$files;
    select * from iceberg_ctl.test_db.test_tbl$data_files;
    select * from iceberg_ctl.test_db.test_tbl$delete_files;
    select * from iceberg_ctl.test_db.test_tbl$partitions;
    select * from iceberg_ctl.test_db.test_tbl$refs;
    select * from iceberg_ctl.test_db.test_tbl$history;
    select * from iceberg_ctl.test_db.test_tbl$metadata_log_entries;
    ```

## 関連情報

Iceberg システムテーブルの詳細については、[Iceberg Catalog のシステムテーブル](../../../lakehouse/catalogs/iceberg-catalog.mdx#system-tables)を参照してください。
