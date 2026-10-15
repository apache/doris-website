---
{
    "title": "SHOW DATA TYPES",
    "language": "ja",
    "description": "このステートメントは、サポートされているすべてのデータ型を表示します。"
}
---

## 説明

    This statement is used to view all supported data types.

## 構文

```sql
SHOW DATA TYPES;
```

## 戻り値

| 列名     | 説明               |
|-------------|------------------|
| TypeName | データ型の名前     |
| Size     | バイト単位のサイズ |

## アクセス制御要件

この SQL コマンドを実行するユーザーに特別な権限は必要ありません。

## 例

- サポートされているすべてのデータ型を表示する

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
    | TIMESTAMP_NS   | 8    |
    | TINYINT        | 1    |
    | VARCHAR        | 16   |
    +----------------+------+
    ```
