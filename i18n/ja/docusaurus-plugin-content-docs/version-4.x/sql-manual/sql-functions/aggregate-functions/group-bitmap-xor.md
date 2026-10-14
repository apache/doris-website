---
{
    "title": "GROUP_BITMAP_XOR",
    "language": "ja",
    "description": "複数の BITMAP の値をまとめ、その結果に対してビット単位の XOR 演算を行います。"
}
---

## 説明

複数の BITMAP の値をまとめ、その結果に対してビット単位の XOR 演算を行います。

## 構文

```sql
GROUP_BITMAP_XOR(<expr>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | サポートされる BITMAP データ型 |

## 戻り値

戻り値のデータ型は BITMAP です。グループ内に有効なデータがない場合は NULL を返します。

## 例

```sql
-- setup
CREATE TABLE pv_bitmap (
	page varchar(10),
	user_id BITMAP
) DISTRIBUTED BY HASH(page) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO pv_bitmap VALUES
	('m', to_bitmap(4)),
	('m', to_bitmap(7)),
	('m', to_bitmap(8)),
	('m', to_bitmap(1)),
	('m', to_bitmap(3)),
	('m', to_bitmap(6)),
	('m', to_bitmap(15)),
	('m', to_bitmap(4)),
	('m', to_bitmap(7));
```

```sql
select page, bitmap_to_string(group_bitmap_xor(user_id)) from pv_bitmap group by page;
```

```text
+------+---------------------------------------------+
| page | bitmap_to_string(group_bitmap_xor(user_id)) |
+------+---------------------------------------------+
| m    | 1,3,6,8,15                                  |
+------+---------------------------------------------+
```

```sql
select bitmap_to_string(group_bitmap_xor(user_id)) from pv_bitmap where page is null;
```

```text
+---------------------------------------------+
| bitmap_to_string(group_bitmap_xor(user_id)) |
+---------------------------------------------+
| NULL                                        |
+---------------------------------------------+
```
