---
{
    "title": "CREATE DATABASE",
    "language": "ja",
    "description": "この文は新しいデータベースの作成に使用します"
}
---

## 説明

この文は新しいデータベースの作成に使用します。

## 構文

```sql
CREATE DATABASE [IF NOT EXISTS] <db_name>
    [PROPERTIES ("<key>"="<value>"[, ... ])];
```

## 必須パラメータ

** 1. `<db_name>`**
>  データベース名

## オプションのパラメータ

** 1. `<PROPERTIES>`**
>  このデータベースに関する追加情報

## 権限

この SQL コマンドを実行するユーザーには、少なくとも以下の権限が必要です。

| 権限         | 対象    | 備考             |
|:-----------|:------|:---------------|
| CREATE_PRIV | 対象のデータベース | 対象のデータベースに対する作成権限が必要です |


## 注意事項

データベース配下のテーブルに対するデフォルトのレプリカ配置戦略を指定するには、`<replication_allocation>` を設定します（テーブルの `<replication_allocation>` 属性はデータベースの設定より優先されます）。

  ```sql
  PROPERTIES (
    "replication_allocation" = "tag.location.default:3"
  )
  ```

データベース配下のテーブルに対するデフォルトの Storage Vault を指定するには、`<storage_vault_name>` を設定します（テーブルの `<storage_vault_name>` 属性はデータベースの設定より優先されます）。

  ```sql
  PROPERTIES (
    "storage_vault_name" = "hdfs_demo_vault"
  )
  ```

:::info Note

データベースの `storage_vault_name` の設定は、バージョン 3.0.5 以降でサポートされています。

:::

## 例

- 新しいデータベース db_test を作成します。

   ```sql
   CREATE DATABASE db_test;
   ```

- 新しいデータベースを作成し、デフォルトのレプリカ配置を設定します。

   ```sql
   CREATE DATABASE `db_test`
   PROPERTIES (
   	"replication_allocation" = "tag.location.group_1:3"
   );
   ```

- 新しいデータベースを作成し、デフォルトの Storage Vault を設定します。

   ```sql
   CREATE DATABASE `db_test`
   PROPERTIES (
   	"storage_vault_name" = "hdfs_demo_vault"
   );
   ```
