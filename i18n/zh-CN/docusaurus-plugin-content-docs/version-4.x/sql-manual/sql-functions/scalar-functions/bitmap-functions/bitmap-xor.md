---
{
    "title": "BITMAP_XOR",
    "language": "zh-CN",
    "description": "计算两个及以上输入 Bitmap 的差集，返回新的 Bitmap。"
}
---

## 描述

计算两个及以上输入 Bitmap 的差集，返回新的 Bitmap。

## 语法

```sql
bitmap_xor(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## 参数

| 参数          | 描述           |
|-------------|--------------|
| `<bitmap1>` | 第一个 Bitmap   |
| `<bitmap2>` | 第二个 Bitmap   |
| ...         | ...          |
| `<bitmapN>` | 第 N 个 Bitmap |

## 返回值

多个 Bitmap 差集的 Bitmap。
- 当参数存在NULL时，返回 NULL

## 示例

计算两个 Bitmap 的对称差集：

```sql
select bitmap_count(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) cnt;
```

结果如下：

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```

将两个 Bitmap 的对称差集转换为字符串：

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) res;
```

结果如下：

```text
+------+
| res  |
+------+
| 1,4  |
+------+
```

计算三个 Bitmap 的对称差集：

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'))) res;
```

结果如下：

```text
+-------+
| res   |
+-------+
| 1,3,5 |
+-------+
```

计算多个 Bitmap（包括一个空 Bitmap）的对称差集：

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), bitmap_empty())) res;
```

结果如下：

```text
+-------+
| res   |
+-------+
| 1,3,5 |
+-------+
```

计算多个 Bitmap（包括一个 `NULL` 值）的对称差集：

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), NULL)) res;
```

结果如下：

```text
+------+
| res  |
+------+
| NULL |
+------+
```
