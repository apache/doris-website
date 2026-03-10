---
{
  "title": "MAP_KEYS",
  "language": "ja",
  "description": "指定されたマップからキーを抽出し、対応する型のARRAYに格納します。"
}
---
## 説明

与えられた`map`からキーを抽出し、対応する型の[`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md)にします。

## 構文

```sql
MAP_KEYS(<map>)
```
## パラメータ
- `<map>` [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 型、入力するマップのコンテンツ。

## 戻り値
指定された `map` からキーを抽出し、対応する型の [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md) として返します。

## 例
1. 通常のパラメータ

    ```sql
    select map_keys(map()),map_keys(map(1, "100", 0.1, 2, null, null));
    ```
    ```text
    +-----------------+---------------------------------------------+
    | map_keys(map()) | map_keys(map(1, "100", 0.1, 2, null, null)) |
    +-----------------+---------------------------------------------+
    | []              | [1.0, 0.1, null]                            |
    +-----------------+---------------------------------------------+
    ```
2. NULL パラメータ

    ```sql
    select map_keys(NULL);
    ```
    ```text
    +----------------+
    | map_keys(NULL) |
    +----------------+
    | NULL           |
    +----------------+
    ```
