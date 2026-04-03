---
{
  "title": "SHOW TYPECAST",
  "language": "ja",
  "description": "データベース下のすべてのtype castを表示する。ユーザーがデータベースを指定した場合は、対応するデータベースを表示する。"
}
---
## 説明

データベース配下のすべての型キャストを表示します。ユーザーがデータベースを指定した場合は、対応するデータベースを表示し、そうでなければ現在のセッションが配置されているデータベースを直接クエリします。

## 構文

```sql
SHOW TYPE_CAST [ { IN | FROM } <db>]
```
## 必須パラメータ

**1. `<db>`**

クエリするデータベースの名前。

## 戻り値

| カラム名 | 説明 |
|-------------|-----------------|
| Origin Type | 元の型   |
| Cast Type   | 変換型 |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限   | オブジェクト        | 備考                                                                                            |
|-------------|---------------|--------------------------------------------------------------------------------------------------|
| `Select_priv` | Database (DB) | ユーザーまたはロールは、データベース下のすべての型変換を表示するために、DBに対する`Select_priv`を持つ必要があります |

## 使用上の注意

ユーザーがデータベースを指定した場合、システムは指定されたデータベースをクエリします。そうでなければ、デフォルトで現在のセッションに関連付けられたデータベースをクエリします。

## 例

- データベースTESTDBのすべての型キャストを表示

    ```sql
    SHOW TYPE_CAST IN TESTDB;
    ```
    ```text
    +----------------+----------------+
    | Origin Type    | Cast Type      |
    +----------------+----------------+
    | DATETIMEV2     | BOOLEAN        |
    | DATETIMEV2     | TINYINT        |
    | DATETIMEV2     | SMALLINT       |
    | DATETIMEV2     | INT            |
    | DATETIMEV2     | BIGINT         |
    | DATETIMEV2     | LARGEINT       |
    | DATETIMEV2     | FLOAT          |
    | DATETIMEV2     | DOUBLE         |
    | DATETIMEV2     | DATE           |
    | DATETIMEV2     | DATETIME       |
    | DATETIMEV2     | DATEV2         |
    | DATETIMEV2     | DATETIMEV2     |
    | DATETIMEV2     | DECIMALV2      |
    | DATETIMEV2     | DECIMAL32      |
    | DATETIMEV2     | DECIMAL64      |
    | DATETIMEV2     | DECIMAL128     |
    | DATETIMEV2     | DECIMAL256     |
    | DATETIMEV2     | VARCHAR        |
    | DATETIMEV2     | STRING         |
    | DECIMAL256     | DECIMAL128     |
    | DECIMAL256     | DECIMAL256     |
    | DECIMAL256     | VARCHAR        |
    | DECIMAL256     | STRING         |
    +----------------+----------------+
    ```
