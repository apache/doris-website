---
{
  "title": "RECOVER",
  "description": "この文は、以前に削除されたデータベース、table、またはパーティションを復旧するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、以前に削除されたデータベース、table、またはパーティションを復旧するために使用されます。

名前またはIDによって指定されたメタデータの復旧をサポートし、復旧されたメタデータの名前変更を可能にします。

## Syntax:

```sql
RECOVER { DATABASE <db_name> [<db_id>] [AS <new_db_name>] 
        | TABLE [<db_name>.]<table_name> [<table_id>] [AS <new_table_name>] 
        | PARTITION <partition_name> [<partition_id>] FROM [<db_name>.]<table_name> [AS <new_partition_name>] }
```
## 必須パラメータ

データベースの復旧

**1. `<db_name>`**
> 復旧するデータベースの名前。

Tableの復旧

**1. `<table_name>`**
> 復旧するTableの名前。

パーティションの復旧

**1. `<partition_name>`**
> 復旧するパーティションの名前。

**2. `<table_name>`**
> パーティションが存在するTableの名前。

## オプションパラメータ

データベースの復旧

**1. `<db_id>`**
> 復旧するデータベースのID。

**2. `<new_db_name>`**
> 復旧されたデータベースの新しい名前。

Tableの復旧

**1. `<db_name>`**
> Tableが存在するデータベースの名前。

**2. `<table_id>`**
> 復旧するTableのID。

**3. `<new_table_name>`**
> 復旧されたTableの新しい名前。

パーティションの復旧

**1. `<partition_id>`**
> 復旧するパーティションのID。

**2. `<db_name>`**
> Tableが存在するデータベースの名前。

**3. `<new_partition_name>`**
> 復旧されたパーティションの新しい名前。

## アクセス制御要件

| Privilege   | Object | Note |
|-------------|--------|------|
| ADMIN_PRIV  |        |      |

## 使用上の注意

- この操作は、一定期間内に削除されたメタデータのみを復旧できます。デフォルトは1日です（`fe.conf`の`catalog_trash_expire_second`パラメータで設定可能）。
- メタデータの復旧時にIDが指定されていない場合、デフォルトで同じ名前で最後に削除されたメタデータが復旧されます。
- `SHOW CATALOG RECYCLE BIN`を使用して、現在復旧可能なメタデータを照会できます。

## 例

1. `example_db`という名前のデータベースを復旧する

    ```sql
    RECOVER DATABASE example_db;
    ```
2. `example_tbl`という名前のTableを復旧する

    ```sql
    RECOVER TABLE example_db.example_tbl;
    ```
3. Table `example_tbl` から `p1` という名前のパーティションを復旧する

    ```sql
    RECOVER PARTITION p1 FROM example_tbl;
    ```
4. ID `example_db_id` と名前 `example_db` を持つデータベースを復旧する

    ```sql
    RECOVER DATABASE example_db example_db_id;
    ```
5. ID `example_tbl_id` と名前 `example_tbl` を持つTableを復旧する

    ```sql
    RECOVER TABLE example_db.example_tbl example_tbl_id;
    ```
6. Table`example_tbl`からID `p1_id`と名前`p1`を持つパーティションを復旧する

    ```sql
    RECOVER PARTITION p1 p1_id FROM example_tbl;
    ```
7. ID `example_db_id` と名前 `example_db` のデータベースを復旧し、`new_example_db` にリネームする

    ```sql
    RECOVER DATABASE example_db example_db_id AS new_example_db;
    ```
8. `example_tbl`という名前のTableを復旧し、`new_example_tbl`にリネームします

    ```sql
    RECOVER TABLE example_db.example_tbl AS new_example_tbl;
    ```
9. Table`example_tbl`からID `p1_id`と名前`p1`を持つパーティションを復旧し、`new_p1`にリネームする

    ```sql
    RECOVER PARTITION p1 p1_id AS new_p1 FROM example_tbl;
    ```
