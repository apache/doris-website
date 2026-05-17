---
{
    "title": "BITMAP_SUBSET_LIMIT",
    "language": "zh-CN",
    "description": "从不小于指定位置 position 开始，按照指定基数 cardinalitylimit 为上限截取 Bitmap 元素，返回一个 Bitmap 子集。"
}
---

## 描述

从不小于指定位置 position 开始，按照指定基数 cardinality_limit 为上限截取 Bitmap 元素，返回一个 Bitmap 子集。

## 语法

```sql
bitmap_subset_limit(<bitmap>, <position>, <cardinality_limit>)
```

## 参数

| 参数                    | 描述          |
|-----------------------|-------------|
| `<bitmap>`            | Bitmap 值    |
| `<position>`          | 范围开始的位置（包含） |
| `<cardinality_limit>` | 基数上限        |

## 返回值

指定范围的子集 Bitmap。
- 当参数存在NULL时或者指定范围为非法取值时，返回 NULL

## 示例

获取从位置 0 开始，基数限制为 3 的 Bitmap 子集：

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 0, 3)) value;
```

结果如下：

```text
+-----------+
| value     |
+-----------+
| 1,2,3     |
+-----------+
```

获取从位置 4 开始，基数限制为 3 的 Bitmap 子集：

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 4, 3)) value;
```

结果如下：

```text
+-------+
| value |
+-------+
| 4,5   |
+-------+
```

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 4, NULL)) value;
```

结果如下：

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), -4, 3)) value;
```

结果如下：

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 4, -3)) value;
```

结果如下：

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```
