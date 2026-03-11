---
{
  "title": "SHOW TYPECAST",
  "description": "データベース配下のすべての型キャストを表示します。ユーザーがデータベースを指定した場合は、対応するデータベースを表示します。",
  "language": "ja"
}
---
## 説明

データベース下のすべての型キャストを表示します。ユーザーがデータベースを指定した場合は、対応するデータベースを表示し、そうでなければ現在のセッションが位置するデータベースを直接クエリします。

## 構文

```sql
SHOW TYPE_CAST [ { IN | FROM } <db>]
```
## 必須パラメータ

**1. `<db>`**

クエリ対象のデータベース名。

## 戻り値

| Column Name | デスクリプション     |
|-------------|-----------------|
| Origin タイプ | 元の型   |
| Cast タイプ   | 変換型 |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege   | Object        | 注釈                                                                                            |
|-------------|---------------|--------------------------------------------------------------------------------------------------|
| `Select_priv` | Database (DB) | データベース下のすべての型変換を表示するには、ユーザーまたはロールがDBに対する`Select_priv`を持つ必要があります |

## 使用上の注意

ユーザーがデータベースを指定した場合、システムは指定されたデータベースをクエリします。指定されない場合、デフォルトで現在のセッションに関連付けられたデータベースをクエリします。

## 例

- データベースTESTDBのすべての型キャストを表示

    ```sql
    SHOW TYPE_CAST IN TESTDB;
    ```
    ```text
    +----------------+----------------+
    | Origin タイプ    | Cast タイプ      |
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
