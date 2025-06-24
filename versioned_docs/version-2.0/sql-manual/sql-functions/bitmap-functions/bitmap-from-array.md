---
{
    "title": "BITMAP_FROM_ARRAY",
    "language": "en"
}
---

## bitmap_from_array

### description
#### Syntax

`BITMAP BITMAP_FROM_ARRAY(ARRAY input)`

Convert a TINYINT/SMALLINT/INT/BIGINT array to a BITMAP
When the input field is illegal, the result returns NULL

### example

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
