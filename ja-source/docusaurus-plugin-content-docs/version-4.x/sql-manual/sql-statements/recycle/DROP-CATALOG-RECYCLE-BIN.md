---
{
  "title": "DROP CATALOG RECYCLE BIN",
  "description": "この文は、recycle bin内のデータベース、table、またはパーティションを即座に削除するために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントは、リサイクルビン内のデータベース、table、またはパーティションを即座に削除するために使用されます。

## 構文

```sql
DROP CATALOG RECYCLE BIN WHERE { 'DbId' = <db_id> | 'TableId' = <table_id> | 'PartitionId' = <partition_id> }
```
## 必須パラメータ

DbIdでデータベースを削除

**1. `<db_id>`**
> 即座に削除するデータベースのID。

TableIdでTableを削除

**1. `<table_id>`**
> 即座に削除するTableのID。

PartitionIdでパーティションを削除

**1. `<partition_id>`**
> 即座に削除するパーティションのID。

## アクセス制御要件

| 権限        | オブジェクト | 備考 |
|-------------|-------------|------|
| ADMIN_PRIV  |             |      |

## 使用上の注意

- データベース、Table、またはパーティションを削除する場合、リサイクルビンは`catalog_trash_expire_second`秒（`fe.conf`で設定）後にそれらを削除します。このステートメントは即座に削除します。
- `'DbId'`、`'TableId'`、および`'PartitionId'`は大文字と小文字を区別せず、シングルクォートとダブルクォートも区別しません。
- リサイクルビンにないデータベースを削除する場合、リサイクルビン内の同じ`DbId`を持つすべてのTableとパーティションも削除されます。何も（データベース、Table、またはパーティション）削除されない場合のみエラーが報告されます。リサイクルビンにないTableを削除する場合も同様です。
- `SHOW CATALOG RECYCLE BIN`を使用して、現在削除可能なメタデータを照会できます。

## 例

1. DbId `example_db_id`のデータベース、Table、およびパーティションを削除

    ```sql
    DROP CATALOG RECYCLE BIN WHERE 'DbId' = example_db_id;
    ```
2. TableId `example_tbl_id` を持つTableとパーティションを削除する

    ```sql
    DROP CATALOG RECYCLE BIN WHERE 'TableId' = example_tbl_id;
    ```
3. PartitionId `p1_id`を持つパーティションを削除する

    ```sql
    DROP CATALOG RECYCLE BIN WHERE 'PartitionId' = p1_id;
    ```
