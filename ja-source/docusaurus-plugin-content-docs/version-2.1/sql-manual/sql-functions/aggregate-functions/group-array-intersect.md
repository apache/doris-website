---
{
  "title": "GROUP_ARRAY_INTERSECT",
  "language": "ja",
  "description": "入力配列の全ての行に共通する交集合要素を計算し、新しい配列を返す。"
}
---
## 説明

入力配列のすべての行にわたって共通要素を計算し、新しい配列を返します。

## 構文

```sql
GROUP_ARRAY_INTERSECT(<expr>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 積集合が必要な配列列または配列値 |

## 戻り値

積集合結果を含む配列を返します

## 例

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
