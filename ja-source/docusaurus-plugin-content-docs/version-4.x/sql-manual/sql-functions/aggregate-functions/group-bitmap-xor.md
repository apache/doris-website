---
{
  "title": "GROUP_BITMAP_XOR",
  "description": "主に複数のbitmapの値をマージし、結果に対してbitwise xor計算を実行するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

主に複数のbitmapの値をマージし、結果に対してビット単位のxor計算を実行するために使用されます。

## Syntax

```sql
GROUP_BITMAP_XOR(<expr>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr>` | サポートされているビットマップデータ型 |

## Return Value

戻り値のデータ型はBITMAPです。グループ内に有効なデータが存在しない場合、NULLを返します。

## Example

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
