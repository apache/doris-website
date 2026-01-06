---
{
    "title": "BITMAP_SUBSET_IN_RANGE",
    "language": "zh-CN",
    "description": "返回 Bitmap 指定范围内的子集 (不包括范围结束)。"
}
---

## 描述

返回 Bitmap 指定范围内的子集 (不包括范围结束)。

## 语法

```sql
bitmap_subset_in_range(<bitmap>, <range_start_include>, <range_end_exclude>)
```

## 参数

| 参数        | 描述        |
|-----------|-----------|
| `<bitmap>` | Bitmap 值  |
| `<range_start_include>` | 范围开始（包含）  |
| `<range_end_exclude>` | 范围结束（不包含） |

## 返回值

指定范围的子集 Bitmap。
- 当参数存在NULL时或者指定范围为非法范围时，返回 NULL


## 示例

获取 Bitmap 中位于范围 0 到 9 内的子集：

```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 0, 9)) value;
```

结果如下：

```text
+-----------+
| value     |
+-----------+
| 1,2,3,4,5 |
+-----------+
```

获取 Bitmap 中位于范围 2 到 3 内的子集：

```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 2, 3)) value;
```

结果如下：

```text
+-------+
| value |
+-------+
| 2     |
+-------+
```


```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 2, NULL)) value;
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
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 2, -10000)) value;
```

结果如下：

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```
