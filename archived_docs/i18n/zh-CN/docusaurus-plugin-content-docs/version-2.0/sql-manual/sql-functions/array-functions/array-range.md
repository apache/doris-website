---
{
    "title": "ARRAY_RANGE",
    "language": "zh-CN"
}
---

## array_range

array_range

## 描述

## 语法

```sql
ARRAY<Int> array_range(Int end)
ARRAY<Int> array_range(Int start, Int end)
ARRAY<Int> array_range(Int start, Int end, Int step)
```
参数均为正整数 start 默认为 0, step 默认为 1。
最终返回一个数组，从start 到 end - 1, 步长为 step。

## 举例

```
mysql> select array_range(10);
+--------------------------------+
| array_range(10)                |
+--------------------------------+
| [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] |
+--------------------------------+

mysql> select array_range(10,20);
+------------------------------------------+
| array_range(10, 20)                      |
+------------------------------------------+
| [10, 11, 12, 13, 14, 15, 16, 17, 18, 19] |
+------------------------------------------+

mysql> select array_range(0,20,2);
+-------------------------------------+
| array_range(0, 20, 2)               |
+-------------------------------------+
| [0, 2, 4, 6, 8, 10, 12, 14, 16, 18] |
+-------------------------------------+
```

### keywords

ARRAY, RANGE, ARRAY_RANGE
