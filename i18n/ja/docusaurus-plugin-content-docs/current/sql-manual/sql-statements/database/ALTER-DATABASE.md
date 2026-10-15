---
{
    "title": "ALTER DATABASE",
    "language": "ja",
    "description": "このステートメントは、指定したデータベースのプロパティの設定、名前の変更、および各種クォータの設定に使用します。"
}
---

## 説明

このステートメントは、指定したデータベースのプロパティの設定、名前の変更、および各種クォータの設定に使用します。

## 構文

```sql
ALTER DATABASE <db_name> RENAME <new_name>
ALTER DATABASE <db_name> SET { DATA | REPLICA | TRANSACTION } QUOTA <quota>
ALTER DATABASE <db_name> SET <PROPERTIES> ("<key>" = "<value>" [, ...])
```

## 必須パラメータ

** 1. `<db_name>`**
>  変更するデータベースの識別子を指定します。

** 2. `<new_db_name>`**
>  データベースの新しい識別子を指定します。

** 3. `<quota>`**
>  データベースのデータ量のクォータ、またはレプリカ数のクォータです。

** 4. `<PROPERTIES>`**
>  このデータベースに関する追加情報です。

## 権限制御

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限         | オブジェクト   | 備考            |
|:-----------|:-----|:--------------|
| ALTER_PRIV | 対象のデータベース | 対象のデータベースを変更する権限が必要です。 |

## 注意事項

データベースの名前を変更した後、必要に応じて REVOKE コマンドと GRANT コマンドを使用し、対応するユーザー権限を変更してください。データベースのデータ量のデフォルトクォータは 1024 GB、レプリカ数のデフォルトクォータは 1073741824 です。

## 例

- 指定したデータベースのデータ量のクォータを設定する

  ```sql
    ALTER DATABASE example_db SET DATA QUOTA 10995116277760;
  ```

- データベース example_db の名前を example_db2 に変更する

  ```sql
    ALTER DATABASE example_db RENAME example_db2;
  ```

- 指定したデータベースのレプリカ数のクォータを設定する

  ```sql
    ALTER DATABASE example_db SET REPLICA QUOTA 102400;
  ```

- データベース内のテーブルのデフォルトのレプリカ分散ポリシーを変更する（この操作は新規作成されるテーブルにのみ適用され、データベース内の既存のテーブルは変更されません）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("replication_allocation" = "tag.location.default:2");
  ```

- データベース内のテーブルのデフォルトのレプリカ分散ポリシーを解除する（この操作は新規作成されるテーブルにのみ適用され、データベース内の既存のテーブルは変更されません）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("replication_allocation" = "");
  ```

- データベース内のテーブルのデフォルトの Storage Vault を変更する（この操作は新規作成されるテーブルにのみ適用され、データベース内の既存のテーブルは変更されません）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("storage_vault_name" = "hdfs_demo_vault");
  ```

- データベース内のテーブルのデフォルトの Storage Vault を解除する（この操作は新規作成されるテーブルにのみ適用され、データベース内の既存のテーブルは変更されません）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("storage_vault_name" = "");
  ```

:::info 注記

データベースの `storage_vault_name` の設定はバージョン 3.0.5 以降でサポートされています。

:::
