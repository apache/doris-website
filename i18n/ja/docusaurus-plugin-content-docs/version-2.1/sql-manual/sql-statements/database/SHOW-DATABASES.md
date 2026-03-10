---
{
  "title": "SHOW DATABASES",
  "language": "ja",
  "description": "このステートメントは、現在表示されているデータベースを表示するために使用されます。"
}
---
## 説明

このステートメントは、現在表示されているデータベースを表示するために使用されます。

## 構文

```sql
SHOW DATABASES [FROM <catalog>] [<filter_expr>];
```
## オプションパラメータ

** 1. `<catalog>`**
>  対応するカタログ

** 2. `<filter_expr>`**
>  指定した条件でフィルタリング

## 戻り値

| Column | Description |
|:---------|:-----------|
| Database |  データベース名|

## 権限制御

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Permissions         | Object    | Notes             |
|:-----------|:------|:---------------|
| SELECT_PRIV | 対応するデータベース | 対応するデータベースの読み取り権限が必要 |

## 示例

- 現在のすべてのデータベース名を表示します。

   ```sql
   SHOW DATABASES;
   ```
   ```text
   +--------------------+
   | Database           |
   +--------------------+
   | test               |
   | information_schema |
   +--------------------+
   ```
- `hms_catalog`内のすべてのデータベース名を表示します。

   ```sql
   SHOW DATABASES FROM hms_catalog;
   ```
   ```text
   +---------------+
   | Database      |
   +---------------+
   | default       |
   | tpch          |
   +---------------+
   ```
- 現在`like 'infor%'`という式でフィルタリングされているすべてのデータベースの名前を表示します。

   ```sql
   SHOW DATABASES like 'infor%';
   ```
   ```text
   +--------------------+
   | Database           |
   +--------------------+
   | information_schema |
   +--------------------+
   ```
