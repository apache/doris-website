---
{
    "title": "BITMAP_FROM_ARRAY",
    "language": "zh-CN"
}
---

## bitmap_from_array

## 描述
## 语法

`BITMAP BITMAP_FROM_ARRAY(ARRAY input)`

将一个TINYINT/SMALLINT/INT/BIGINT类型的数组转化为一个BITMAP
当输入字段不合法时，结果返回NULL

## 举例

```
mysql> select *, bitmap_to_string(bitmap_from_array(c_array)) from array_test;
+------+-----------------------+------------------------------------------------+
| id   | c_array               | bitmap_to_string(bitmap_from_array(`c_array`)) |
+------+-----------------------+------------------------------------------------+
|    1 | [NULL]                | NULL                                           |
|    2 | [1, 2, 3, NULL]       | NULL                                           |
|    2 | [1, 2, 3, -10]        | NULL                                           |
|    3 | [1, 2, 3, 4, 5, 6, 7] | 1,2,3,4,5,6,7                                  |
|    4 | [100, 200, 300, 300]  | 100,200,300                                    |
+------+-----------------------+------------------------------------------------+
5 rows in set (0.02 sec)
```

### keywords

    BITMAP_FROM_ARRAY,BITMAP
