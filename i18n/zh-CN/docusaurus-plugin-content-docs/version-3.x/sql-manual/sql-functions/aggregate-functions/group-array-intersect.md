---
{
"title": "GROUP_ARRAY_INTERSECT",
"language": "zh-CN"
}
---

## 描述

求出所有行中输入数组中的交集元素，返回一个新的数组

## 语法

```sql
GROUP_ARRAY_INTERSECT(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 需要求交集的数组列或数组值 |

## 返回值

返回一个包含交集结果的数组

## 举例

```sql
select c_array_string from group_array_intersect_test where id in (18, 20);
```

```text
+------+---------------------------+
| id   | col                       |
+------+---------------------------+
|    1 | ["a", "b", "c", "d", "e"] |
|    2 | ["a", "b"]                |
|    3 | ["a", null]               |
+------+---------------------------+
```

```sql
select group_array_intersect(col) from group_array_intersect_test;
```

```text
+----------------------------+
| group_array_intersect(col) |
+----------------------------+
| ["a"]                      |
+----------------------------+
```
