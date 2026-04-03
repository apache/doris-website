---
{
  "title": "GROUP_ARRAY_INTERSECT",
  "description": "入力配列の全ての行にわたって共通する要素を計算し、新しい配列を返します。",
  "language": "ja"
}
---
## 説明

入力配列の全ての行にわたって共通要素を計算し、新しい配列を返します。

## 構文

```sql
GROUP_ARRAY_INTERSECT(<expr>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 積集合を計算する式、サポートされる型: Array。 |

## 戻り値

積集合の結果を含む配列を返します。グループに有効なデータがない場合は、空の配列を返します。

## 例

```sql
-- setup
CREATE TABLE group_array_intersect_test (
    id INT,
    c_array_string ARRAY<STRING>
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO group_array_intersect_test VALUES
    (1, ['a', 'b', 'c', 'd', 'e']),
    (2, ['a', 'b']),
    (3, ['a', null]);
```
```sql
select group_array_intersect(c_array_string) from group_array_intersect_test;
```
```text
+---------------------------------------+
| group_array_intersect(c_array_string) |
+---------------------------------------+
| ["a"]                                 |
+---------------------------------------+
```
```sql
select group_array_intersect(c_array_string) from group_array_intersect_test where id is null;
```
```text
+---------------------------------------+
| group_array_intersect(c_array_string) |
+---------------------------------------+
| []                                    |
+---------------------------------------+
```
