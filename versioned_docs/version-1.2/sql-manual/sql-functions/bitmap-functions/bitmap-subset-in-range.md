---
{
    "title": "BITMAP_SUBSET_IN_RANGE",
    "language": "en"
}
---

## bitmap_subset_in_range

### Description

#### Syntax

`BITMAP BITMAP_SUBSET_IN_RANGE(BITMAP src, BIGINT range_start, BIGINT range_end)`

Return subset in specified range (not include the range_end).

### example

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
