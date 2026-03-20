---
{
  "title": "BITNOT",
  "description": "整数に対してビット単位のNOT演算を実行します。",
  "language": "ja"
}
---
## 説明
整数に対してビット単位のNOT演算を実行します。

サポートされている整数型: TINYINT, SMALLINT, INT, BIGINT, LARGEINT。

## 構文

```sql
BITNOT(<x>)
```
## パラメータ
- `<x>`: 演算を実行する整数。

## Return Value
整数に対するビット単位のNOT演算の結果を返します。

## Examples
1. Example 1

    ```sql
    select BITNOT(7), BITNOT(-127);
    ```
    ```text
    +-----------+--------------+
    | BITNOT(7) | BITNOT(-127) |
    +-----------+--------------+
    |        -8 |          126 |
    +-----------+--------------+
    ```
2. NULL引数

    ```sql
    select BITNOT(NULL);
    ```
    ```text
    +--------------+
    | BITNOT(NULL) |
    +--------------+
    |         NULL |
    +--------------+
    ```
