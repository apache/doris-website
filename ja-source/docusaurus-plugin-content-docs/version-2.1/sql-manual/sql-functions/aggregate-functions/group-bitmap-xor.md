---
{
  "title": "GROUP_BITMAP_XOR",
  "language": "ja",
  "description": "主に複数のbitmapの値をマージし、結果に対してbitwise xor計算を実行するために使用される。"
}
---
## 説明

主に複数のビットマップの値をマージし、結果に対してビット単位のxor計算を実行するために使用されます。

## 構文

```sql
GROUP_BITMAP_XOR(<expr>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | サポートされているビットマップデータ型 |

## 戻り値

戻り値のデータ型はBITMAPです。

## 例

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
