---
{
  "title": "BITOR",
  "description": "2つの整数に対してビット単位のOR演算を実行するために使用されます。",
  "language": "ja"
}
---
## デスクリプション
2つの整数に対してビット単位のOR演算を実行するために使用されます。

整数の範囲: TINYINT, SMALLINT, INT, BIGINT, LARGEINT

## Syntax

```sql
BITOR( <lhs>, <rhs>)
```
## パラメータ
| parameter | description                                                             |
|-----------|-------------------------------------------------------------------------|
| `<lhs>`   | 評価される最初のBOOLEAN値                                 |
| `<rhs>`   | 評価される2番目のBOOLEAN値 |

## Return Value

2つの整数に対するOR演算の結果を返します。

## Examples

```sql
select BITOR(3,5), BITOR(4,7);
```
```text
+---------+---------+
| (3 | 5) | (4 | 7) |
+---------+---------+
|       7 |       7 |
+---------+---------+
```
