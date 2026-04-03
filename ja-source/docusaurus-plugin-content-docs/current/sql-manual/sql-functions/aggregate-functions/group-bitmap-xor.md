---
{
  "title": "GROUP_BITMAP_XOR",
  "language": "ja",
  "description": "主に複数のbitmapの値をマージし、結果に対してbitwise xor計算を実行するために使用されます。"
}
---
## 説明

主に複数のビットマップの値をマージし、結果に対してビット単位のXOR計算を実行するために使用されます。

## 構文

```sql
GROUP_BITMAP_XOR(<expr>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | サポートされているビットマップデータ型 |

## 戻り値

戻り値のデータ型はBITMAPです。グループ内に有効なデータがない場合、NULLを返します。

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
