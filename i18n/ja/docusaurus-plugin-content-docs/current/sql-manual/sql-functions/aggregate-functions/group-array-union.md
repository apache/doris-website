---
{
    "title": "GROUP_ARRAY_UNION",
    "language": "ja",
    "description": "すべての行の入力配列に含まれる要素の和集合を求め、新しい配列として返します。"
}
---

## 説明

すべての行の入力配列に含まれる要素の和集合を求め、新しい配列として返します。

## 構文

```sql
GROUP_ARRAY_UNION(<expr>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 和集合を計算する式。サポートされる型: Array<Type>。Array 内に複合型をネストすることはできません。 |

## 戻り値

和集合の結果を含む配列を返します。グループに有効なデータがない場合は、空の配列を返します。

## 例


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
