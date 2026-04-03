---
{
  "title": "HUDI_META",
  "description": "hudimeta table-valued-function(tvf)は、hudiメタデータ、操作履歴、tableのタイムライン、インスタント状態などを読み取るために使用されます。",
  "language": "ja"
}
---
## 説明

`hudi_meta` table-valued-function(tvf)は、hudiメタデータ、操作履歴、tableのタイムライン、インスタント状態などを読み取るために使用されます。

3.1.0以降でサポートされています。

## 構文

```sql
HUDI_META(
    "table" = "<table>", 
    "query_type" = "<query_type>"
  );
```
## 必須パラメーター
`hudi_meta`Table関数（tvf）の各パラメーターは`"key"="value"`のペアです。

| フィールド        | 説明                                                                                                                        |
|--------------|------------------------------------------------------------------------------------------------------------------------------------|
| `<table>`    | 完全なTable名。表示したいhudiTableに対して`database_name.table_name`の形式で指定する必要があります。 |
| `<query_type>` | 表示したいメタデータのタイプ。現在は`timeline`のみがサポートされています。                                                    |


## 例

- timelineのhudiTableメタデータを読み取りアクセスします。

    ```sql
    select * from hudi_meta("table" = "ctl.db.tbl", "query_type" = "timeline");
    ```
- `desc function` と併用できます：

    ```sql
    desc function hudi_meta("table" = "ctl.db.tbl", "query_type" = "timeline");
    ```
- hudi Tableのタイムラインを検査する

    ```sql
    select * from hudi_meta("table" = "hudi_ctl.test_db.test_tbl", "query_type" = "timeline");
    ```
    ```text
    +-------------------+--------+--------------------------+-----------+-----------------------+
    | timestamp         | action | file_name                | state     | state_transition_time |
    +-------------------+--------+--------------------------+-----------+-----------------------+
    | 20240724195843565 | commit | 20240724195843565.commit | COMPLETED | 20240724195844269     |
    | 20240724195845718 | commit | 20240724195845718.commit | COMPLETED | 20240724195846653     |
    | 20240724195848377 | commit | 20240724195848377.commit | COMPLETED | 20240724195849337     |
    | 20240724195850799 | commit | 20240724195850799.commit | COMPLETED | 20240724195851676     |
    +-------------------+--------+--------------------------+-----------+-----------------------+
    ```
- タイムスタンプでフィルタリング

    ```sql
    select * from hudi_meta("table" = "hudi_ctl.test_db.test_tbl", "query_type" = "timeline") where timestamp = 20240724195843565;
    ```
    ```text
    +-------------------+--------+--------------------------+-----------+-----------------------+
    | timestamp         | action | file_name                | state     | state_transition_time |
    +-------------------+--------+--------------------------+-----------+-----------------------+
    | 20240724195843565 | commit | 20240724195843565.commit | COMPLETED | 20240724195844269     |
    +-------------------+--------+--------------------------+-----------+-----------------------+
    ```
