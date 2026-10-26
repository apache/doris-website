---
{
    "title": "ALTER DATABASE",
    "language": "ja",
    "description": "この文は、指定したデータベースのプロパティの設定、名前の変更、および各種クォータの設定に使用します。"
}
---

## 説明 {#description}

この文は、指定したデータベースのプロパティの設定、名前の変更、および各種クォータの設定に使用します。

## 構文 {#syntax}

```sql
ALTER DATABASE <db_name> RENAME <new_name>
ALTER DATABASE <db_name> SET { DATA | REPLICA | TRANSACTION } QUOTA <quota>
ALTER DATABASE <db_name> SET <PROPERTIES> ("<key>" = "<value>" [, ...])
```

## 必須パラメータ {#required-parameters}

** 1. `<db_name>`**
>  変更するデータベースの識別子を指定します。

** 2. `<new_db_name>`**
>  データベースの新しい識別子を指定します。

** 3. `<quota>`**
>  データベースのデータ容量クォータ、またはレプリカ数のクォータを指定します。

** 4. `<PROPERTIES>`**
>  このデータベースの追加情報を指定します。

## 権限管理 {#permission-control}

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限         | 対象   | 備考            |
|:-----------|:-----|:--------------|
| ALTER_PRIV | 対象のデータベース | 対象のデータベースを変更する権限が必要です。 |

## 注意事項 {#precautions}

- データ容量とレプリカ数のクォータは、新しいデータやレプリカを追加する操作の受け入れ上限です。クォータを現在の使用量より低く設定しても、既存のデータやレプリカは削除されません。現在の使用量がクォータに達するか超えると、Doris は該当する使用量を増やす後続の操作を拒否します。
- `RECOVER` は、ごみ箱からメタデータと既存のデータまたはレプリカを復元します。新しいデータの書き込みやレプリカの作成は行わないため、データ容量やレプリカ数のクォータによってブロックされません。復元に成功すると、データベースの使用量がクォータを超える場合があります。その後、データやレプリカを追加する操作は、使用量がクォータを下回るか、クォータを引き上げるまでブロックされます。

データベースの名前を変更した後は、必要に応じて REVOKE コマンドと GRANT コマンドを使用し、対応するユーザー権限を変更してください。データベースのデータ容量クォータのデフォルト値は 1024 GB、レプリカ数のクォータのデフォルト値は 1073741824 です。

## 例 {#example}

- 指定したデータベースのデータ容量クォータを設定する

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

- db 内のテーブルに適用するデフォルトのレプリカ配置ポリシーを変更する（この操作は新規作成されるテーブルにのみ有効で、db 内の既存のテーブルは変更されません）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("replication_allocation" = "tag.location.default:2");
  ```

- db 内のテーブルに適用するデフォルトのレプリカ配置ポリシーを解除する（この操作は新規作成されるテーブルにのみ有効で、db 内の既存のテーブルは変更されません）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("replication_allocation" = "");
  ```

- db 内のテーブルに適用するデフォルトの Storage Vault を変更する（この操作は新規作成されるテーブルにのみ有効で、db 内の既存のテーブルは変更されません）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("storage_vault_name" = "hdfs_demo_vault");
  ```

- db 内のテーブルに適用するデフォルトの Storage Vault を解除する（この操作は新規作成されるテーブルにのみ有効で、db 内の既存のテーブルは変更されません）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("storage_vault_name" = "");
  ```

:::info 注記

db の `storage_vault_name` の設定は、バージョン 3.0.5 以降でサポートされています。

:::
