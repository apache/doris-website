---
{
    "title": "TIME",
    "language": "en",
    "description": "TIME"
}
---

## TIME

### name

TIME

### description

TIME type
    Time type, can appear as a query result, does not support table storage for the time being. The storage range is `[-838:59:59, 838:59:59]`.
    Currently in Doris, the correctness of TIME as a result of calculations is guaranteed (e.g., functions such as `timediff`), but **manual CAST generation of the TIME type is not recommended**.
    The calculation of TIME type in constant folding is prohibited.

### example

```sql
mysql> select timediff('2020-01-01 12:05:03', '2020-01-01 08:02:15');
+------------------------------------------------------------------------------------------------------+
| timediff(cast('2020-01-01 12:05:03' as DATETIMEV2(0)), cast('2020-01-01 08:02:15' as DATETIMEV2(0))) |
+------------------------------------------------------------------------------------------------------+
| 04:02:48                                                                                             |
+------------------------------------------------------------------------------------------------------+
1 row in set (0.12 sec)

mysql> select timediff('2020-01-01', '2000-01-01');
+------------------------------------------------------------------------------------+
| timediff(cast('2020-01-01' as DATETIMEV2(0)), cast('2000-01-01' as DATETIMEV2(0))) |
+------------------------------------------------------------------------------------+
| 838:59:59                                                                          |
+------------------------------------------------------------------------------------+
1 row in set (0.11 sec)
```

### keywords

    TIME
