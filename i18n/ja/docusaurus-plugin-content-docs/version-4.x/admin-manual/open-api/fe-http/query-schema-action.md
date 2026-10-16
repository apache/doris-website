---
{
    "title": "クエリスキーマの取得（Query Schema Action）",
    "language": "ja",
    "description": "Query Schema Action は、指定した SQL に関連するテーブルの CREATE TABLE 文を返します。ローカルで一部のクエリシナリオをテストする際に使用できます。"
}
---

# クエリスキーマの取得（Query Schema Action）


## リクエスト

```
POST /api/query_schema/<ns_name>/<db_name>
```

## 説明

Query Schema Action は、指定した SQL に関連するテーブルの CREATE TABLE 文を返します。ローカルで一部のクエリシナリオをテストする際に使用できます。

この API はバージョン 1.2 でリリースされました。
    
## パスパラメータ

* `<db_name>`

    データベース名を指定します。このデータベースは現在のセッションのデフォルトデータベースとみなされ、SQL 内のテーブル名にデータベース名が指定されていない場合に使用されます。

## クエリパラメータ

なし

## リクエストボディ

```
text/plain

sql
```

* "sql" フィールドには SQL 文字列を指定します。

## レスポンス

* 戻り値

    ```
    CREATE TABLE `tbl1` (
      `k1` int(11) NULL,
      `k2` int(11) NULL
    ) ENGINE=OLAP
    DUPLICATE KEY(`k1`, `k2`)
    COMMENT 'OLAP'
    DISTRIBUTED BY HASH(`k1`) BUCKETS 3
    PROPERTIES (
    "replication_allocation" = "tag.location.default: 1",
    "in_memory" = "false",
    "storage_format" = "V2",
    "disable_auto_compaction" = "false"
    );
    
    CREATE TABLE `tbl2` (
      `k1` int(11) NULL,
      `k2` int(11) NULL
    ) ENGINE=OLAP
    DUPLICATE KEY(`k1`, `k2`)
    COMMENT 'OLAP'
    DISTRIBUTED BY HASH(`k1`) BUCKETS 3
    PROPERTIES (
    "replication_allocation" = "tag.location.default: 1",
    "in_memory" = "false",
    "storage_format" = "V2",
    "disable_auto_compaction" = "false"
    );
    ```

## 使用例

1. SQL をローカルファイル 1.sql に記述します。

    ```
    select tbl1.k2 from tbl1 join tbl2 on tbl1.k1 = tbl2.k1;
    ```
    
2. curl を使用してテーブルの CREATE TABLE 文を取得します。

    ```
    curl -X POST -H 'Content-Type: text/plain'  -uroot: http://127.0.0.1:8030/api/query_schema/internal/db1 -d@1.sql
    ```
