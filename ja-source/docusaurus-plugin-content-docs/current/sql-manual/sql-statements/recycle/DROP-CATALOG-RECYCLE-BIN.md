---
{
  "title": "DROP CATALOG RECYCLE BIN",
  "language": "ja",
  "description": "このステートメントは、recycle bin内のデータベース、テーブル、またはパーティションを即座に削除するために使用されます。"
}
---
## 説明

このステートメントは、リサイクルビン内のデータベース、テーブル、またはパーティションを即座に削除するために使用されます。

## 構文

```sql
DROP CATALOG RECYCLE BIN WHERE { 'DbId' = <db_id> | 'TableId' = <table_id> | 'PartitionId' = <partition_id> }
```
## 必須パラメータ

DbIdでデータベースを削除

**1. `<db_id>`**
> 即座に削除するデータベースのID。

TableIdでテーブルを削除

**1. `<table_id>`**
> 即座に削除するテーブルのID。

PartitionIdでパーティションを削除

**1. `<partition_id>`**
> 即座に削除するパーティションのID。

## アクセス制御要件

| Privilege   | Object | Note |
|-------------|--------|------|
| ADMIN_PRIV  |        |      |

## 使用上の注意

- データベース、テーブル、またはパーティションを削除する場合、ゴミ箱は`catalog_trash_expire_second`秒後（`fe.conf`で設定）にそれらを削除します。このステートメントは即座にそれらを削除します。
- `'DbId'`、`'TableId'`、および`'PartitionId'`は大文字と小文字を区別せず、単一引用符と二重引用符を区別しません。
- ゴミ箱にないデータベースを削除する場合、ゴミ箱内の同じ`DbId`を持つすべてのテーブルとパーティションも削除されます。何も（データベース、テーブル、またはパーティション）削除されない場合のみエラーを報告します。ゴミ箱にないテーブルを削除する場合も同様です。
- `SHOW CATALOG RECYCLE BIN`を使用して、現在削除可能なメタデータをクエリできます。

## 例

1. DbId `example_db_id`を持つデータベース、テーブル、およびパーティションを削除

    ```sql
    DROP CATALOG RECYCLE BIN WHERE 'DbId' = example_db_id;
    ```
2. TableId `example_tbl_id`のテーブルとパーティションを削除する

    ```sql
    DROP CATALOG RECYCLE BIN WHERE 'TableId' = example_tbl_id;
    ```
3. PartitionId `p1_id` のパーティションを削除する

    ```sql
    DROP CATALOG RECYCLE BIN WHERE 'PartitionId' = p1_id;
    ```
