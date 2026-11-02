---
{
    "title": "ALTER DATABASE",
    "language": "ja",
    "description": "このステートメントは、指定したデータベースのプロパティを設定し、データベース名を変更し、データベースの各種クォータを設定するために使用します。"
}
---

## 説明 {#description}

このステートメントは、指定したデータベースのプロパティを設定し、データベース名を変更し、データベースの各種クォータを設定するために使用します。

## 構文 {#syntax}

```sql
ALTER DATABASE <db_name> RENAME <new_name>
ALTER DATABASE <db_name> SET { DATA | REPLICA | TRANSACTION } QUOTA <quota>
ALTER DATABASE <db_name> SET <PROPERTIES> ("<key>" = "<value>" [, ...])
```

## 必須パラメータ {#required-parameters}

** 1. `<db_name>`**
>  変更対象のデータベース識別子を指定します。

** 2. `<new_db_name>`**
>  データベースの新しい識別子を指定します。

** 3. `<quota>`**
>  データベースのデータ量クォータまたはデータベースのレプリカ数クォータ

** 4. `<PROPERTIES>`**
>  このデータベースに関する追加情報

## 権限管理 {#permission-control}

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限         | オブジェクト   | 注記            |
|:-----------|:-----|:--------------|
| ALTER_PRIV | 対応するデータベース | 対応するデータベースを変更する権限が必要です。 |

## 注意事項 {#precautions}

- データ量クォータおよびレプリカ数クォータは、新しいデータまたはレプリカを追加する操作に対する受付制限です。クォータを現在の使用量より低くしても、既存のデータやレプリカは削除されません。現在の使用量がクォータに達するか超えると、Doris は対応する使用量を増加させる後続の操作を拒否します。
- `RECOVER` はごみ箱にあるメタデータと既存のデータまたはレプリカを復元します。新しいデータを書き込んだり新しいレプリカを作成したりしないため、データ量クォータやレプリカ数クォータによる制限を受けません。復元が成功すると、データベースの使用量がクォータを超える可能性があります。使用量がクォータを下回るか、クォータを引き上げるまで、データまたはレプリカを追加する後続の操作は引き続きブロックされます。

データベースの名前を変更した後、必要に応じて REVOKE および GRANT コマンドを使用して、対応するユーザー権限を変更してください。データベースのデフォルトのデータ量クォータは 1024 GB、デフォルトのレプリカ数クォータは 1073741824 です。

## 例 {#example}

- 指定したデータベースのデータ量クォータを設定する

  ```sql
    ALTER DATABASE example_db SET DATA QUOTA 10995116277760;
  ```

- データベース example_db の名前を example_db2 に変更する

  ```sql
    ALTER DATABASE example_db RENAME example_db2;
  ```

- 指定したデータベースのレプリカ数クォータを設定する

  ```sql
    ALTER DATABASE example_db SET REPLICA QUOTA 102400;
  ```

- データベース内のテーブルのデフォルトのレプリカ分散戦略を変更する（この操作は新しく作成するテーブルにのみ有効で、データベース内の既存のテーブルは変更しません）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("replication_allocation" = "tag.location.default:2");
  ```

- データベース内のテーブルのデフォルトのレプリカ分散ポリシーを解除する（この操作は新しく作成するテーブルにのみ有効で、データベース内の既存のテーブルは変更しません）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("replication_allocation" = "");
  ```

- データベース内のテーブルに設定されるデフォルトの Storage Vault を変更する（この操作は新しく作成するテーブルにのみ有効で、データベース内の既存のテーブルは変更しません）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("storage_vault_name" = "hdfs_demo_vault");
  ```

- データベース内のテーブルに設定されるデフォルトの Storage Vault を解除する（この操作は新しく作成するテーブルにのみ有効で、データベース内の既存のテーブルは変更しません）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("storage_vault_name" = "");
  ```

:::info 注記

データベースの `storage_vault_name` の設定はバージョン 3.0.5 以降でサポートされます。

:::
