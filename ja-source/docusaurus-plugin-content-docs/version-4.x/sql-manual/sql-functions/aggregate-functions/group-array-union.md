---
{
  "title": "GROUP_ARRAY_UNION",
  "description": "入力配列のすべての行からすべての要素の一意な和集合を求め、新しい配列を返します。",
  "language": "ja"
}
---
## 説明

入力配列のすべての行からすべての要素の一意な和集合を見つけ、新しい配列を返します。

## 構文

```sql
GROUP_ARRAY_UNION(<expr>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr>` | unionを計算する式。サポートされる型：Array<タイプ>。Array内での複雑な型のネストはサポートされていません。 |

## Return Value

union結果を含む配列を返します。グループ内に有効なデータがない場合は、空の配列を返します。

## Example

```sql
-- setup
CREATE TABLE group_array_union_test (
	id INT,
	c_array_string ARRAY<STRING>
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO group_array_union_test VALUES
	(1, ['a', 'b', 'c', 'd', 'e']),
	(2, ['a', 'b']),
	(3, ['a', null]),
	(4, NULL);
```
```sql
select GROUP_ARRAY_UNION(c_array_string) from group_array_union_test;
```
```text
+-----------------------------------+
| GROUP_ARRAY_UNION(c_array_string) |
+-----------------------------------+
| [null, "c", "e", "b", "d", "a"]   |
+-----------------------------------+
```
```sql
select GROUP_ARRAY_UNION(c_array_string) from group_array_union_test where id in (3,4);
```
```text
+-----------------------------------+
| GROUP_ARRAY_UNION(c_array_string) |
+-----------------------------------+
| [null, "a"]                       |
+-----------------------------------+
```
```sql
select GROUP_ARRAY_UNION(c_array_string) from group_array_union_test where id in (4);
```
```text
+-----------------------------------+
| GROUP_ARRAY_UNION(c_array_string) |
+-----------------------------------+
| []                                |
+-----------------------------------+
```
