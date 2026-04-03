---
{
  "title": "MAP_VALUES",
  "description": "指定されたMAPから値を抽出し、対応する型のARRAYに変換します。",
  "language": "ja"
}
---
## 説明

指定された[`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md)から値を抽出し、対応する型の[`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md)として返します。

## 構文

```sql
MAP_VALUES(<map>)
```
## パラメータ
- `<map>` [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 型、入力するマップの内容。

## 戻り値
指定された`map`から値を抽出し、対応する型の[`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md)として返します。

## 使用上の注意
1. NULLパラメータの場合、NULLを返します。
2. 空のMAPオブジェクトの場合、空の配列を返します。
3. MAP内のNULL値も返される配列に含まれます。

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
2. NULLパラメータ

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
