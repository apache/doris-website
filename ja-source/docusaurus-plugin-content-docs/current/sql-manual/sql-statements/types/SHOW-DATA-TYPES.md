---
{
  "title": "データ型を表示",
  "language": "ja",
  "description": "このステートメントは、サポートされているすべてのデータ型を表示するために使用されます。"
}
---
## 説明

    このステートメントは、サポートされているすべてのデータ型を表示するために使用されます。

## 構文

```sql
SHOW DATA TYPES;
```
## 戻り値

| Column Name | Description      |
|-------------|------------------|
| TypeName    | 型の名前 |
| Size        | サイズ（バイト単位）    |

## アクセス制御要件

このSQLコマンドを実行するユーザーには特定の権限は必要ありません。

## 例

- サポートされているすべてのデータ型を表示

    ```sql
    SHOW DATA TYPES;
    ```
    ```text
    +----------------+------+
    | TypeName       | Size |
    +----------------+------+
    | AGG_STATE      | 16   |
    | ARRAY          | 32   |
    | BIGINT         | 8    |
    | BITMAP         | 16   |
    | BOOLEAN        | 1    |
    | CHAR           | 16   |
    | DATE           | 16   |
    | DATETIME       | 16   |
    | DATETIMEV2     | 8    |
    | DATEV2         | 4    |
    | DECIMAL128     | 16   |
    | DECIMAL32      | 4    |
    | DECIMAL64      | 8    |
    | DECIMALV2      | 16   |
    | DOUBLE         | 8    |
    | FLOAT          | 4    |
    | HLL            | 16   |
    | INT            | 4    |
    | IPV4           | 4    |
    | IPV6           | 16   |
    | JSON           | 16   |
    | LARGEINT       | 16   |
    | MAP            | 24   |
    | QUANTILE_STATE | 16   |
    | SMALLINT       | 2    |
    | STRING         | 16   |
    | TINYINT        | 1    |
    | VARCHAR        | 16   |
    +----------------+------+
    ```
