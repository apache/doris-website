---
{
  "title": "BITNOT",
  "language": "ja",
  "description": "整数に対してビット単位の反転操作を実行するために使用されます。"
}
---
## 説明
整数に対してビット単位の反転操作を実行するために使用されます。

整数の範囲：TINYINT、SMALLINT、INT、BIGINT、LARGEINT

## 構文

```sql
BITNOT( <x>)
```
## パラメータ
| parameter | description |
|-----------|-------------|
| `<x>`     | Integer operations      |

## 戻り値
1つの整数のNOT演算の結果を返します。

## 例

```sql
select BITNOT(7), BITNOT(-127);
```
```text
+-------+----------+
| (~ 7) | (~ -127) |
+-------+----------+
|    -8 |      126 |
+-------+----------+
```
