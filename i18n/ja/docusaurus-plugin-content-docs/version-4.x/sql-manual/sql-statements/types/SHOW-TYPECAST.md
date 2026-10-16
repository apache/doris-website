---
{
    "title": "SHOW TYPECAST",
    "language": "ja",
    "description": "データベース内のすべての型変換を表示します。データベースを指定した場合はそのデータベースを、指定しない場合は現在のセッションのデータベースを照会します。"
}
---

## 説明

データベース内のすべての型変換を表示します。データベースを指定した場合はそのデータベースを、指定しない場合は現在のセッションのデータベースを照会します。

## 構文

```sql
SHOW TYPE_CAST [ { IN | FROM } <db>]
```

## 必須パラメータ

**1. `<db>`**

照会するデータベースの名前。

## 戻り値

| 列名        | 説明       |
|-------------|------------|
| Origin Type | 元の型     |
| Cast Type   | 変換後の型 |

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限          | 対象               | 説明                                                                       |
|---------------|--------------------|----------------------------------------------------------------------------|
| `Select_priv` | データベース（DB） | データベース内のすべての型変換を表示するには、ユーザーまたはロールに対象データベースの `Select_priv` が必要です。 |

## 使用上の注意

データベースを指定した場合は、そのデータベースを照会します。指定しない場合は、デフォルトで現在のセッションのデータベースを照会します。

## 例

- データベース TESTDB 内のすべての型変換を表示します。

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
