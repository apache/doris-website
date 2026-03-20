---
{
  "title": "GROUP_BITMAP_XOR",
  "description": "主に複数のビットマップの値をマージし、結果に対してビット単位のxor計算を実行するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

主に複数のbitmapの値をマージし、結果に対してbitwise xor計算を実行するために使用されます。

## Syntax

```sql
GROUP_BITMAP_XOR(<expr>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr>` | サポートされているビットマップデータ型 |

## Return Value

戻り値のデータ型はBITMAPです。

## Example

```sql
 select page, bitmap_to_string(user_id) from pv_bitmap;
```
```text
+------+-----------------------------+
| page | bitmap_to_string(`user_id`) |
+------+-----------------------------+
| m    | 4,7,8                       |
| m    | 1,3,6,15                    |
| m    | 4,7                         |
+------+-----------------------------+
```
```sql
select page, bitmap_to_string(group_bitmap_xor(user_id)) from pv_bitmap group by page;
```
```text
+------+-----------------------------------------------+
| page | bitmap_to_string(group_bitmap_xor(`user_id`)) |
+------+-----------------------------------------------+
| m    | 1,3,6,8,15                                    |
+------+-----------------------------------------------+
```
