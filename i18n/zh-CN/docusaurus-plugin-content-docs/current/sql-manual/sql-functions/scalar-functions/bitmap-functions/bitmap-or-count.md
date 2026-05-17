---
{
    "title": "BITMAP_OR_COUNT",
    "language": "zh-CN",
    "description": "计算两个及以上输入 Bitmap 的并集，返回并集的元素个数。"
}
---

## 描述

计算两个及以上输入 Bitmap 的并集，返回并集的元素个数。

## 语法

```sql
bitmap_or_count(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## 参数

| 参数          | 描述           |
|-------------|--------------|
| `<bitmap1>` | 第一个 Bitmap   |
| `<bitmap2>` | 第二个 Bitmap   |
| ...         | ...          |
| `<bitmapN>` | 第 N 个 Bitmap |

## 返回值

多个 Bitmap 并集的元素个数。  

## 示例

计算一个非空 Bitmap 和一个空 Bitmap 的并集中的元素数量：

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_empty()) res;
```

结果如下：

```text
+------+
| res  |
+------+
|    3 |
+------+
```

计算两个相同 Bitmap 的并集中的元素数量：

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2,3')) res;
```

结果如下：

```text
+------+
| res  |
+------+
|    3 |
+------+
```

计算两个不同 Bitmap 的并集中的元素数量：

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5')) res;
```

结果如下：

```text
+------+
| res  |
+------+
|    5 |
+------+
```

计算多个 Bitmap（包括一个空 Bitmap）的并集中的元素数量：

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'), to_bitmap(100), bitmap_empty()) res;
```

结果如下：

```text
+------+
| res  |
+------+
|    6 |
+------+
```

计算多个 Bitmap（包括一个 `NULL` 值）的并集中的元素数量：

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'), to_bitmap(100), NULL) res;
```

结果如下：

```text
+------+
| res  |
+------+
|    6 |
+------+
```
