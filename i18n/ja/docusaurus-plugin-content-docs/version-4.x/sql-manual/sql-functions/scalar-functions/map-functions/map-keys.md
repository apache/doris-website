---
{
    "title": "MAP_KEYS",
    "language": "ja",
    "description": "指定した MAP からキーを取り出し、対応する型の ARRAY として返します。"
}
---

## 説明

指定した `map` からキーを取り出し、対応する型の [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md) として返します。

## 構文

```sql
MAP_KEYS(<map>)
```

## パラメータ
- `<map>` 入力する [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 型の値。

## 戻り値
指定した `map` からキーを取り出し、対応する型の [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md) として返します。

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