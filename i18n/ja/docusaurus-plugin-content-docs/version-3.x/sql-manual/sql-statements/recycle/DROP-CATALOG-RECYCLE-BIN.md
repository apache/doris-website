---
{
  "title": "DROP CATALOG RECYCLE BIN",
  "description": "この文は、recycle bin内のデータベース、table、またはパーティションを即座に削除するために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントは、ごみ箱内のデータベース、table、またはパーティションを即座に削除するために使用されます。

## 構文

```sql
DROP CATALOG RECYCLE BIN WHERE { 'DbId' = <db_id> | 'TableId' = <table_id> | 'PartitionId' = <partition_id> }
```
## 必須パラメータ

DbIdでデータベースを削除

**1. `<db_id>`**
> 即座に削除されるデータベースのID。

TableIdでTableを削除

**1. `<table_id>`**
> 即座に削除されるTableのID。

PartitionIdでパーティションを削除

**1. `<partition_id>`**
> 即座に削除されるパーティションのID。

## アクセス制御要件

| Privilege   | Object | Note |
|-------------|--------|------|
| ADMIN_PRIV  |        |      |

## 使用上の注意

- データベース、Table、またはパーティションを削除する場合、ごみ箱は`catalog_trash_expire_second`秒後（`fe.conf`で設定）にそれらを削除します。このステートメントはそれらを即座に削除します。
- `'DbId'`、`'TableId'`、および`'PartitionId'`は大文字小文字を区別せず、シングルクォートとダブルクォートを区別しません。
- ごみ箱にないデータベースを削除する場合、ごみ箱内の同じ`DbId`を持つすべてのTableとパーティションも削除されます。何も（データベース、Table、またはパーティション）削除されない場合のみエラーが報告されます。ごみ箱にないTableを削除する場合も同様です。
- 現在削除可能なメタデータは`SHOW CATALOG RECYCLE BIN`を使用して照会できます。

## 例

1. DbId `example_db_id`のデータベース、Table、およびパーティションを削除

    ```sql
    DROP CATALOG RECYCLE BIN WHERE 'DbId' = example_db_id;
    ```
2. TableId `example_tbl_id` を持つTableとパーティションを削除する

    ```sql
    DROP CATALOG RECYCLE BIN WHERE 'TableId' = example_tbl_id;
    ```
3. PartitionId `p1_id`のパーティションを削除します

    ```sql
    DROP CATALOG RECYCLE BIN WHERE 'PartitionId' = p1_id;
    ```
