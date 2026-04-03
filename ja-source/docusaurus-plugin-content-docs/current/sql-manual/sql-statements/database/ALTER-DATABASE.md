---
{
  "title": "ALTER DATABASE",
  "language": "ja",
  "description": "この文は、指定されたdbのプロパティを設定し、db名を変更し、dbの各種クォータを設定するために使用されます。"
}
---
## 説明

このステートメントは、指定されたdbのプロパティを設定し、db名を変更し、dbの様々なクォータを設定するために使用されます。

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
>  データベースの新しい識別子を指定します

** 3. `<quota>`**
>  データベースのデータボリュームクォータまたはデータベースレプリカ数クォータ

** 4. `<PROPERTIES>`**
>  このデータベースに関する追加情報

## 権限制御

このSQLコマンドを実行するユーザーは、最低限以下の権限を持っている必要があります：

| 権限         | オブジェクト   | 備考            |
|:-----------|:-----|:--------------|
| ALTER_PRIV | 対応するデータベース | 対応するデータベースを変更する権限が必要です。 |

## 注意事項

データベース名を変更した後、必要に応じてREVOKEコマンドとGRANTコマンドを使用して対応するユーザー権限を変更してください。データベースのデフォルトデータボリュームクォータは1024 GBで、デフォルトレプリカ数クォータは1073741824です。

## 例

- 指定したデータベースのデータボリュームクォータを設定

  ```sql
    ALTER DATABASE example_db SET DATA QUOTA 10995116277760;
  ```
- データベース example_db を example_db2 にリネームする

  ```sql
    ALTER DATABASE example_db RENAME example_db2;
  ```
- 指定されたデータベースのコピー数に対してクォータを設定する

  ```sql
    ALTER DATABASE example_db SET REPLICA QUOTA 102400;
  ```
- db配下のテーブルのデフォルトレプリカ配布戦略を変更する（この操作は新しく作成されるテーブルに対してのみ有効で、db配下の既存のテーブルは変更されません）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("replication_allocation" = "tag.location.default:2");
  ```
- db配下のテーブルのデフォルトレプリカ配布ポリシーをキャンセルする（この操作は新しく作成されるテーブルに対してのみ有効であり、db配下の既存のテーブルは変更されません）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("replication_allocation" = "");
  ```
- db配下のテーブルのデフォルトStorage Vaultを変更する（この操作は新しく作成されるテーブルに対してのみ有効であり、db配下の既存のテーブルは変更されません）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("storage_vault_name" = "hdfs_demo_vault");
  ```
- db配下のテーブルのデフォルトStorage Vaultをキャンセルする（この操作は新規作成されるテーブルに対してのみ有効で、db配下の既存のテーブルは変更されません）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("storage_vault_name" = "");
  ```
:::info Note

バージョン3.0.5以降、dbの`storage_vault_name`の設定がサポートされています

:::
