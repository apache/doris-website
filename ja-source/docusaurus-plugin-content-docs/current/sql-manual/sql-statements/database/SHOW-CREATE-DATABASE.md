---
{
  "title": "SHOW CREATE DATABASE",
  "language": "ja",
  "description": "この文は、doris組み込みデータベースまたはカタログデータベースの作成情報をチェックします。"
}
---
## 説明

このステートメントは、doris組み込みデータベースまたはcatalogデータベースの作成情報を確認します。

## 構文

```sql
SHOW CREATE DATABASE [<catalog>.]<db_name>;
```
## 必須パラメータ

** 1. `<db_name>`**
>  データベース名

## オプションパラメータ

** 1. `<catalog>`**
>  テーブルが内部か外部かを示します

## 戻り値

| Column | Description |
|:---------|:-----------|
| Database | データベース名 |
| Create Database | 対応するデータベース作成文 |

## 権限制御

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Permissions         | Object    | Notes             |
|:-----------|:------|:---------------|
| SELECT_PRIV | 対応するデータベース | 対応するデータベースの読み取り権限が必要 |

## 例

- dorisでtestデータベースの作成を表示

   ```sql
   SHOW CREATE DATABASE test;
   ```
   ```text
   +----------+------------------------+
   | Database | Create Database        |
   +----------+------------------------+
   | test     | CREATE DATABASE `test` |
   +----------+------------------------+
   ```
- hive カタログ内のデータベース hdfs_text の作成情報を表示する

   ```sql
   SHOW CREATE DATABASE hdfs_text;
   ```
   ```text
   +-----------+------------------------------------------------------------------------------------+                         
   | Database  | Create Database                                                                    |                         
   +-----------+------------------------------------------------------------------------------------+                         
   | hdfs_text | CREATE DATABASE `hdfs_text` LOCATION 'hdfs://HDFS1009138/hive/warehouse/hdfs_text' |                         
   +-----------+------------------------------------------------------------------------------------+  
   ```
