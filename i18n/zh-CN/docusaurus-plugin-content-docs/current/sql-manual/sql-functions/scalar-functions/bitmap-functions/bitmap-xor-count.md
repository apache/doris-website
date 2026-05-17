---
{
    "title": "BITMAP_XOR_COUNT",
    "language": "zh-CN",
    "description": "将两个及以上 Bitmap 集合进行异或操作并返回结果集的大小。"
}
---

## 描述

将两个及以上 Bitmap 集合进行异或操作并返回结果集的大小。

## 语法

```sql
bitmap_xor_count(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## 参数

| 参数          | 描述           |
|-------------|--------------|
| `<bitmap1>` | 第一个 Bitmap   |
| `<bitmap2>` | 第二个 Bitmap   |
| ...         | ...          |
| `<bitmapN>` | 第 N 个 Bitmap |

## 返回值

将两个及以上 Bitmap 集合进行异或操作得到的差集 Bitmap 元素数量。  
当输入的 Bitmap 参数中有 `NULL` 时，结果为 0。

## 示例

计算两个 Bitmap 的对称差集中的元素数量：

```sql
select bitmap_xor_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5')) res;
```

结果如下：

```text
+------+
| res  |
+------+
|    4 |
+------+
```

计算两个相同 Bitmap 的对称差集中的元素数量：

```sql
select bitmap_xor_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2,3')) res;
```

结果如下：

```text
+------+
| res  |
+------+
|    0 |
+------+
```

计算两个不同 Bitmap 的对称差集中的元素数量：

```sql
select bitmap_xor_count(bitmap_from_string('1,2,3'), bitmap_from_string('4,5,6')) as res;
```

结果如下：

```text
+------+
| res  |
+------+
|    6 |
+------+
```

计算三个 Bitmap 的对称差集中的元素数量：

```sql
select bitmap_xor_count(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5')) res;
```

结果如下：

```text
+------+
| res  |
+------+
|    3 |
+------+
```

计算多个 Bitmap（包括一个空 Bitmap）的对称差集中的元素数量：

```sql
select bitmap_xor_count(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), bitmap_empty()) res;
```

结果如下：

```text
+------+
| res  |
+------+
|    3 |
+------+
```

计算多个 Bitmap（包括一个 `NULL` 值）的对称差集中的元素数量：

```sql
select bitmap_xor_count(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), NULL) res;
```

结果如下：

```text
+------+
| res  |
+------+
|    0 |
+------+
```

