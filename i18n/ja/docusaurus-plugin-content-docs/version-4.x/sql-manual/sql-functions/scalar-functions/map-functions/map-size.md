---
{
  "title": "MAP_SIZE",
  "description": "Mapの要素数を計算します",
  "language": "ja"
}
---
## 説明

Map内の要素数を計算します

## 構文

```sql
MAP_SIZE(<map>)
```
## パラメータ
- `<map>` [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 型、入力するマップの内容。
## 戻り値
Mapの要素数を返します

## 使用上の注意
1. NULLキーとNULL値の両方がカウントされます。
2. NULLパラメータの場合、NULLを返します。

## 例
1. 通常のパラメータ

    ```sql
    select map_size(map()), map_size(map(1, "100", 0.1, 2, null, null));
    ```
    ```text
    +-----------------+---------------------------------------------+
    | map_size(map()) | map_size(map(1, "100", 0.1, 2, null, null)) |
    +-----------------+---------------------------------------------+
    |               0 |                                           3 |
    +-----------------+---------------------------------------------+
    ```
2. NULLパラメータ

    ```sql
    select map_size(NULL);
    ```
    ```text
    +----------------+
    | map_size(NULL) |
    +----------------+
    |           NULL |
    +----------------+
    ```
