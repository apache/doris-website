---
{
"title": "INTERSECT_COUNT",
"language": "en"
}
---

## intersect_count
### description
#### Syntax

`BITMAP INTERSECT_COUNT(bitmap_column, column_to_filter, filter_values)`
Calculate the intersection of two or more bitmaps
Usage: intersect_count(bitmap_column_to_count, filter_column, filter_values ...)
Example: intersect_count(user_id, event, 'A', 'B', 'C'), meaning find the intersect count of user_id in all A/B/C 3 bitmaps

### example

```
MySQL [test_query_qa]> select dt,bitmap_to_string(user_id) from pv_bitmap where dt in (3,4);
+------+-----------------------------+
| dt   | bitmap_to_string(`user_id`) |
+------+-----------------------------+
|    4 | 1,2,3                       |
|    3 | 1,2,3,4,5                   |
+------+-----------------------------+
2 rows in set (0.012 sec)

MySQL [test_query_qa]> select intersect_count(user_id,dt,3,4) from pv_bitmap;
+----------------------------------------+
| intersect_count(`user_id`, `dt`, 3, 4) |
+----------------------------------------+
|                                      3 |
+----------------------------------------+
1 row in set (0.014 sec)
```

### keywords

    INTERSECT_COUNT,BITMAP
