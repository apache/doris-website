---
{
    "title": "MAP_VALUES",
    "language": "ja",
    "description": "指定した MAP から値を取り出し、対応する型の ARRAY として返します。"
}
---

## 説明

指定した [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) から値を取り出し、対応する型の [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md) として返します。

## 構文

```sql
MAP_VALUES(<map>)
```

## パラメータ
- `<map>` 入力する [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 型の値。

## 戻り値
指定した `map` から値を取り出し、対応する型の [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md) として返します。

## 使用上の注意
1. パラメータが NULL の場合は NULL を返します。
2. 空の MAP の場合は空の配列を返します。
3. MAP 内の NULL 値も戻り値の配列に含まれます。

## 例
1. 通常のパラメータ
    ```sql
    select map_values(map()), map_values(map(1, "100", 0.1, 2, 0.3, null));
    ```

    ```text
    +-------------------+----------------------------------------------+
    | map_values(map()) | map_values(map(1, "100", 0.1, 2, 0.3, null)) |
    +-------------------+----------------------------------------------+
    | []                | ["100", "2", null]                           |
    +-------------------+----------------------------------------------+
    ```
2. NULL パラメータ
    ```sql
    select map_values(null);
    ```
    ```text
    +------------------+
    | map_values(null) |
    +------------------+
    | NULL             |
    +------------------+
    ```
