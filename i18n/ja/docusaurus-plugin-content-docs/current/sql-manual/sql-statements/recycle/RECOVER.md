---
{
    "title": "RECOVER",
    "language": "ja",
    "description": "このステートメントは、以前に削除されたデータベース、テーブル、またはパーティションを復元するために使用します。"
}
---

## 説明 {#description}

このステートメントは、以前に削除されたデータベース、テーブル、またはパーティションを復元するために使用します。

名前または ID を指定してメタデータを復元でき、復元したメタデータの名前も変更できます。

## 構文: {#syntax}

```sql
RECOVER { DATABASE <db_name> [<db_id>] [AS <new_db_name>]
        | TABLE [<db_name>.]<table_name> [<table_id>] [AS <new_table_name>]
        | PARTITION <partition_name> [<partition_id>] FROM [<db_name>.]<table_name> [AS <new_partition_name>] }
```

## 必須パラメータ {#required-parameters}

データベースを復元する場合

**1. `<db_name>`**
> 復元するデータベースの名前。

テーブルを復元する場合

**1. `<table_name>`**
> 復元するテーブルの名前。

パーティションを復元する場合

**1. `<partition_name>`**
> 復元するパーティションの名前。

**2. `<table_name>`**
> パーティションが属するテーブルの名前。

## 省略可能なパラメータ {#optional-parameters}

データベースを復元する場合

**1. `<db_id>`**
> 復元するデータベースの ID。

**2. `<new_db_name>`**
> 復元後のデータベースの新しい名前。

テーブルを復元する場合

**1. `<db_name>`**
> テーブルが属するデータベースの名前。

**2. `<table_id>`**
> 復元するテーブルの ID。

**3. `<new_table_name>`**
> 復元後のテーブルの新しい名前。

パーティションを復元する場合

**1. `<partition_id>`**
> 復元するパーティションの ID。

**2. `<db_name>`**
> テーブルが属するデータベースの名前。

**3. `<new_partition_name>`**
> 復元後のパーティションの新しい名前。

## アクセス制御要件 {#access-control-requirements}

| 権限        | オブジェクト | 備考 |
|-------------|--------|------|
| ADMIN_PRIV  |        |      |

## 使用上の注意 {#usage-notes}

- この操作で復元できるのは、一定期間内に削除されたメタデータのみです。デフォルトは 1 日で、`catalog_trash_expire_second` パラメータを `fe.conf` で設定して変更できます。
- メタデータの復元時に ID を指定しない場合、デフォルトでは同じ名前で最後に削除されたメタデータが復元されます。
- 現在復元可能なメタデータは、`SHOW CATALOG RECYCLE BIN` で確認できます。
- 復元では、ごみ箱にある既存のメタデータ、データ、レプリカを再び関連付けます。新たなデータの書き込みやレプリカの作成としては扱われません。そのため、復元したオブジェクトによってデータベースの使用量がクォータを超える場合でも、データやレプリカのクォータによって `RECOVER` が妨げられることはありません。その後にデータやレプリカを追加する操作には、引き続きクォータが適用されます。

## 例 {#examples}

1. `example_db` という名前のデータベースを復元する

    ```sql
    RECOVER DATABASE example_db;
    ```

2. `example_tbl` という名前のテーブルを復元する

    ```sql
    RECOVER TABLE example_db.example_tbl;
    ```

3. `p1` という名前のパーティションをテーブル `example_tbl` から復元する

    ```sql
    RECOVER PARTITION p1 FROM example_tbl;
    ```

4. ID が `example_db_id`、名前が `example_db` のデータベースを復元する

    ```sql
    RECOVER DATABASE example_db example_db_id;
    ```

5. ID が `example_tbl_id`、名前が `example_tbl` のテーブルを復元する

    ```sql
    RECOVER TABLE example_db.example_tbl example_tbl_id;
    ```

6. ID が `p1_id`、名前が `p1` のパーティションをテーブル `example_tbl` から復元する

    ```sql
    RECOVER PARTITION p1 p1_id FROM example_tbl;
    ```

7. ID が `example_db_id`、名前が `example_db` のデータベースを復元し、`new_example_db` に名前を変更する

    ```sql
    RECOVER DATABASE example_db example_db_id AS new_example_db;
    ```

8. `example_tbl` という名前のテーブルを復元し、`new_example_tbl` に名前を変更する

    ```sql
    RECOVER TABLE example_db.example_tbl AS new_example_tbl;
    ```

9. ID が `p1_id`、名前が `p1` のパーティションをテーブル `example_tbl` から復元し、`new_p1` に名前を変更する

    ```sql
    RECOVER PARTITION p1 p1_id AS new_p1 FROM example_tbl;
    ```
