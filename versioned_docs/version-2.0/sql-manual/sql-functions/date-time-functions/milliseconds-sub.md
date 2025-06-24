---
{
    "title": "MILLISECONDS_SUB",
    "language": "en"
}
---

## milliseconds_sub
### description
#### Syntax

`DATETIMEV2 milliseconds_sub(DATETIMEV2 basetime, INT delta)`
- basetime: Base time whose type is DATETIMEV2
- delta: Milliseconds to subtract from basetime
- Return type of this function is DATETIMEV2

### example
```
mysql> select milliseconds_sub('2023-09-08 16:02:08.435123', 1);
+--------------------------------------------------------------------------+
| milliseconds_sub(cast('2023-09-08 16:02:08.435123' as DATETIMEV2(6)), 1) |
+--------------------------------------------------------------------------+
| 2023-09-08 16:02:08.434123                                               |
+--------------------------------------------------------------------------+
1 row in set (0.11 sec)
```


### keywords
    milliseconds_sub

    