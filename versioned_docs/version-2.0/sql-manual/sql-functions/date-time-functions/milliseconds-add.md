---
{
    "title": "MILLISECONDS_ADD",
    "language": "en"
}
---

## milliseconds_add
### description
#### Syntax

`DATETIMEV2 milliseconds_add(DATETIMEV2 basetime, INT delta)`
- basetime: Base time whose type is DATETIMEV2
- delta:Milliseconds to add to basetime
- Return type of this function is DATETIMEV2

### example
```
mysql> select milliseconds_add('2023-09-08 16:02:08.435123', 1);
+--------------------------------------------------------------------------+
| milliseconds_add(cast('2023-09-08 16:02:08.435123' as DATETIMEV2(6)), 1) |
+--------------------------------------------------------------------------+
| 2023-09-08 16:02:08.436123                                               |
+--------------------------------------------------------------------------+
1 row in set (0.04 sec)
```


### keywords
    milliseconds_add

    