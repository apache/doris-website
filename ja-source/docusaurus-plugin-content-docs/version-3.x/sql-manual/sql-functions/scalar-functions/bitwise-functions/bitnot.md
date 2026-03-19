---
{
  "title": "BITNOT",
  "description": "整数に対してビット単位の反転操作を実行するために使用されます。",
  "language": "ja"
}
---
## デスクリプション
整数に対してビット単位の反転操作を実行するために使用されます。

整数の範囲: TINYINT, SMALLINT, INT, BIGINT, LARGEINT

## Syntax

```sql
BITNOT( <x>)
```
## パラメータ
| parameter | description |
|-----------|-------------|
| `<x>`     | 整数演算      |

## Return Value
1つの整数のNOT演算の結果を返します。

## Examples

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
