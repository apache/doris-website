---
{
  "title": "ALTER DATABASE",
  "language": "ja",
  "description": "このステートメントは、指定されたdbのプロパティを設定し、db名を変更し、dbの様々なクォータを設定するために使用されます。"
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
>  データベースデータ容量クォータまたはデータベースレプリカ数クォータ

** 4. `<PROPERTIES>`**
>  このデータベースに関する追加情報

## 権限制御

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限         | オブジェクト   | 備考            |
|:-----------|:-----|:--------------|
| ALTER_PRIV | 対応するデータベース | 対応するデータベースを変更する権限が必要です。 |

## 注意事項

データベースの名前を変更した後、必要に応じてREVOKEおよびGRANTコマンドを使用して対応するユーザー権限を修正してください。データベースのデフォルトデータ容量クォータは1024 GBで、デフォルトレプリカ数クォータは1073741824です。

## 例

- 指定されたデータベースのデータ容量クォータを設定

  ```sql
    ALTER DATABASE example_db SET DATA QUOTA 10995116277760;
  ```
- データベース example_db を example_db2 にリネームする

  ```sql
    ALTER DATABASE example_db RENAME example_db2;
  ```
- 指定されたデータベースのコピー数にクォータを設定する

  ```sql
    ALTER DATABASE example_db SET REPLICA QUOTA 102400;
  ```
- db配下のテーブルのデフォルトレプリカ分散戦略を変更します（この操作は新しく作成されるテーブルにのみ有効で、db配下の既存のテーブルは変更されません）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("replication_allocation" = "tag.location.default:2");
  ```
- db配下のテーブルのデフォルトレプリカ分散ポリシーをキャンセルします（この操作は新しく作成されるテーブルに対してのみ有効で、db配下の既存のテーブルは変更されません）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("replication_allocation" = "");
  ```
