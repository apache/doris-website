---
{
    "title": "MAP_SIZE",
    "language": "ja",
    "description": "MAP の要素数を計算します"
}
---

## 説明

MAP の要素数を計算します

## 構文

```sql
MAP_SIZE(<map>)
```

## パラメータ
- `<map>` 入力する [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 型の値。
## 戻り値
MAP の要素数を返します

## 使用上の注意
1. NULL のキーと値も数えます。
2. パラメータが NULL の場合は NULL を返します。

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
2. NULL パラメータ
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