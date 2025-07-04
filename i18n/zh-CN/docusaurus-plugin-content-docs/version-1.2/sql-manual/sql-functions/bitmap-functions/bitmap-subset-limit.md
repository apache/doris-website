---
{
    "title": "BITMAP_SUBSET_LIMIT",
    "language": "zh-CN"
}
---

## bitmap_subset_limit

## 描述

## 语法

`BITMAP BITMAP_SUBSET_LIMIT(BITMAP src, BIGINT range_start, BIGINT cardinality_limit)`

生成 src 的子 BITMAP， 从不小于 range_start 的位置开始，大小限制为 cardinality_limit 。
range_start：范围起始点（含）
cardinality_limit：子BIGMAP基数上限

## 举例

```
mysql> select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 0, 3)) value;
+-----------+
| value     |
+-----------+
| 1,2,3 |
+-----------+

mysql> select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 4, 3)) value;
+-------+
| value |
+-------+
| 4，5     |
+-------+
```

### keywords

    BITMAP_SUBSET_LIMIT,BITMAP_SUBSET,BITMAP
