---
{
  "title": "GROUP_ARRAY_INTERSECT",
  "description": "入力配列のすべての行にわたって共通する要素を計算し、新しい配列を返します。",
  "language": "ja"
}
---
## デスクリプション

入力配列のすべての行にわたって共通する要素を計算し、新しい配列を返します。

## Syntax

```sql
GROUP_ARRAY_INTERSECT(<expr>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr>` | 積集合を求める配列カラムまたは配列値 |

## Return Value

積集合の結果を含む配列を返します

## Example

```sql
select c_array_string from group_array_intersect_test where id in (18, 20);
```
```text
+------+---------------------------+
| id   | col                       |
+------+---------------------------+
|    1 | ["a", "b", "c", "d", "e"] |
|    2 | ["a", "b"]                |
|    3 | ["a", null]               |
+------+---------------------------+
```
```sql
select group_array_intersect(col) from group_array_intersect_test;
```
```text
+----------------------------+
| group_array_intersect(col) |
+----------------------------+
| ["a"]                      |
+----------------------------+
```
