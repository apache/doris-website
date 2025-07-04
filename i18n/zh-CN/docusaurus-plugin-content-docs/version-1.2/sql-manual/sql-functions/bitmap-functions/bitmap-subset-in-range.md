---
{
    "title": "BITMAP_SUBSET_IN_RANGE",
    "language": "zh-CN"
}
---

## bitmap_subset_in_range

## 描述

## 语法

`BITMAP BITMAP_SUBSET_IN_RANGE(BITMAP src, BIGINT range_start, BIGINT range_end)`

返回 BITMAP 指定范围内的子集(不包括范围结束)。

## 举例

```
mysql> select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 0, 9)) value;
+-----------+
| value     |
+-----------+
| 1,2,3,4,5 |
+-----------+

mysql> select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 2, 3)) value;
+-------+
| value |
+-------+
| 2     |
+-------+
```

### keywords

    BITMAP_SUBSET_IN_RANGE,BITMAP_SUBSET,BITMAP
