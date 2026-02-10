---
{
    "title": "GROUP_BITMAP_XOR",
    "language": "zh-CN"
}
---

## group_bitmap_xor
## 描述
## 语法

`BITMAP GROUP_BITMAP_XOR(expr)`

对expr进行 xor 计算, 返回新的bitmap。

## 举例

```
mysql>  select page, bitmap_to_string(user_id) from pv_bitmap;
+------+-----------------------------+
| page | bitmap_to_string(`user_id`) |
+------+-----------------------------+
| m    | 4,7,8                       |
| m    | 1,3,6,15                    |
| m    | 4,7                         |
+------+-----------------------------+

mysql> select page, bitmap_to_string(group_bitmap_xor(user_id)) from pv_bitmap group by page;
+------+-----------------------------------------------+
| page | bitmap_to_string(group_bitmap_xor(`user_id`)) |
+------+-----------------------------------------------+
| m    | 1,3,6,8,15                                    |
+------+-----------------------------------------------+
```

### keywords

    GROUP_BITMAP_XOR,BITMAP
