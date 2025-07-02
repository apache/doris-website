---
{
"title": "INTERSECT_COUNT",
"language": "zh-CN"
}
---

## intersect_count
## 描述
## 语法

`BITMAP INTERSECT_COUNT(bitmap_column, column_to_filter, filter_values)`
聚合函数，求bitmap交集大小的函数, 不要求数据分布正交
第一个参数是Bitmap列，第二个参数是用来过滤的维度列，第三个参数是变长参数，含义是过滤维度列的不同取值

## 举例

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
