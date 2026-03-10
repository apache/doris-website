---
{
  "title": "BITNOT",
  "language": "ja",
  "description": "整数に対してビット単位のNOT演算を実行します。"
}
---
## 説明
整数に対してビット単位のNOT演算を実行します。

サポートされている整数型: TINYINT、SMALLINT、INT、BIGINT、LARGEINT。

## 構文

```sql
BITNOT(<x>)
```
## パラメータ
- `<x>`: 演算を実行する整数。

## 戻り値
整数に対するビット単位のNOT演算の結果を返します。

## 例
1. 例1

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
