---
{
    "title": "GROUP_ARRAY_INTERSECT",
    "language": "ja",
    "description": "すべての行にわたって入力配列の共通要素を求め、新しい配列として返します。"
}
---

## 説明

すべての行にわたって入力配列の共通要素を求め、新しい配列として返します。

## 構文

```sql
GROUP_ARRAY_INTERSECT(<expr>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 共通要素を求める式。サポートされる型: Array。 |

## 戻り値

共通要素を含む配列を返します。グループに有効なデータがない場合は、空の配列を返します。

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
