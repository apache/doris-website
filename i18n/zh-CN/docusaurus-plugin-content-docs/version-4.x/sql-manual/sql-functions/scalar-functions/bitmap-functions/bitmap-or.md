---
{
    "title": "BITMAP_OR",
    "language": "zh-CN",
    "description": "计算两个及以上的 Bitmap 的并集，返回新的 Bitmap。"
}
---

## 描述

计算两个及以上的 Bitmap 的并集，返回新的 Bitmap。

## 语法

```sql
bitmap_or(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## 参数

| 参数          | 描述           |
|-------------|--------------|
| `<bitmap1>` | 第一个 Bitmap   |
| `<bitmap2>` | 第二个 Bitmap   |
| ...         | ...          |
| `<bitmapN>` | 第 N 个 Bitmap |

## 返回值

多个 Bitmap 并集的 Bitmap。

## 示例

计算两个相同 Bitmap 的并集：

```sql
select bitmap_count(bitmap_or(to_bitmap(1), to_bitmap(1))) cnt;
```

结果如下：

```text
+------+
| cnt  |
+------+
|    1 |
+------+
```

将两个相同 Bitmap 的并集转换为字符串：

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(1)));
```

结果如下：

```text
+---------------------------------------------------------+
| bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(1))) |
+---------------------------------------------------------+
| 1                                                       |
+---------------------------------------------------------+
```

计算两个不同 Bitmap 的并集：

```sql
select bitmap_count(bitmap_or(to_bitmap(1), to_bitmap(2))) cnt;
```

结果如下：

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```

将两个不同 Bitmap 的并集转换为字符串：

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2)));
```

结果如下：

```text
+---------------------------------------------------------+
| bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2))) |
+---------------------------------------------------------+
| 1,2                                                     |
+---------------------------------------------------------+
```

计算多个 Bitmap（包括 `NULL` 值）的并集：

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2), to_bitmap(10), to_bitmap(0), NULL)) as res;
```

结果如下：

```text
+----------+
| res      |
+----------+
| 0,1,2,10 |
+----------+
```

计算多个 Bitmap（包括空 Bitmap）的并集：

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2), to_bitmap(10), to_bitmap(0), bitmap_empty())) as res;
```

结果如下：

```text
+----------+
| res      |
+----------+
| 0,1,2,10 |
+----------+
```

计算由字符串和单个值创建的 Bitmap 的并集：

```sql
select bitmap_to_string(bitmap_or(to_bitmap(10), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'))) as res;
```

结果如下：

```text
+--------------+
| res          |
+--------------+
| 1,2,3,4,5,10 |
+--------------+
```
