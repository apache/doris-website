---
{
    "title": "DROP CATALOG RECYCLE BIN",
    "language": "ja",
    "description": "このステートメントは、ごみ箱内のデータベース、テーブル、またはパーティションを即座に削除します。"
}
---

## 説明

このステートメントは、ごみ箱内のデータベース、テーブル、またはパーティションを即座に削除します。

## 構文

```sql
DROP CATALOG RECYCLE BIN WHERE { 'DbId' = <db_id> | 'TableId' = <table_id> | 'PartitionId' = <partition_id> }
```

## 必須パラメータ

DbId を指定してデータベースを削除する場合

**1. `<db_id>`**
> 即座に削除するデータベースの ID。

TableId を指定してテーブルを削除する場合

**1. `<table_id>`**
> 即座に削除するテーブルの ID。

PartitionId を指定してパーティションを削除する場合

**1. `<partition_id>`**
> 即座に削除するパーティションの ID。

## アクセス権限の要件

| 権限        | オブジェクト | 備考 |
|-------------|--------|------|
| ADMIN_PRIV  |        |      |

## 使用上の注意

- ごみ箱内のデータベース、テーブル、またはパーティションは、`fe.conf` で設定する `catalog_trash_expire_second` 秒が経過すると削除されます。このステートメントを使うと即座に削除できます。
- `'DbId'`、`'TableId'`、`'PartitionId'` は大文字と小文字を区別せず、単一引用符と二重引用符のどちらも使用できます。
- ごみ箱内にないデータベースを指定した場合でも、ごみ箱内に同じ `DbId` を持つテーブルやパーティションがあれば、すべて削除されます。データベース、テーブル、パーティションのいずれも削除されなかった場合にのみ、エラーが報告されます。ごみ箱内にないテーブルを指定した場合も同様です。
- `SHOW CATALOG RECYCLE BIN` で、現在削除可能なメタデータを確認できます。

## 例

1. DbId が `example_db_id` のデータベース、テーブル、パーティションを削除する

    ```sql
    DROP CATALOG RECYCLE BIN WHERE 'DbId' = example_db_id;
    ```

2. TableId が `example_tbl_id` のテーブルとパーティションを削除する

    ```sql
    DROP CATALOG RECYCLE BIN WHERE 'TableId' = example_tbl_id;
    ```

3. PartitionId が `p1_id` のパーティションを削除する

    ```sql
    DROP CATALOG RECYCLE BIN WHERE 'PartitionId' = p1_id;
    ```
