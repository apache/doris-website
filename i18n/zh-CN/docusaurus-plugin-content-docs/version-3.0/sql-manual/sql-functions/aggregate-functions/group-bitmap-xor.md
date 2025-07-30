---
{
"title": "GROUP_BITMAP_XOR",
"language": "zh-CN"
}
---

## 描述

主要用于合并多个 bitmap 的值，并对结果进行按位 xor 计算

## 语法

```sql
GROUP_BITMAP_XOR(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 支持 bitmap 的数据类型 |

## 返回值

返回值的数据类型为 BITMAP。

## 举例

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
