---
{
    "title": "BITMAP_SUBSET_LIMIT",
    "language": "en"
}
---

## bitmap_subset_limit

### Description

#### Syntax

`BITMAP BITMAP_SUBSET_LIMIT(BITMAP src, BIGINT range_start, BIGINT cardinality_limit)`

Create subset of the BITMAP, begin with range from range_start, limit by cardinality_limit
range_start: start value for the range
cardinality_limit: subset upper limit

### example

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
| 4,5     |
+-------+
```

### keywords

    BITMAP_SUBSET_LIMIT,BITMAP_SUBSET,BITMAP
