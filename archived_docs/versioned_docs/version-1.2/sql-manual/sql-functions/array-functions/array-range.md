---
{
    "title": "ARRAY_RANGE",
    "language": "en"
}
---

## array_range

array_range

### description

#### Syntax

```sql
ARRAY<Int> array_range(Int end)
ARRAY<Int> array_range(Int start, Int end)
ARRAY<Int> array_range(Int start, Int end, Int step)
```
The parameters are all positive integers. 
start default value is 0, and step default value is 1.
Return the array which numbers from start to end - 1 by step.


### notice

`Only supported in vectorized engine`

### example

```
mysql> select array_range(10);
+--------------------------------+
| array_range(10)                |
+--------------------------------+
| [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] |
+--------------------------------+

mysql> select array_range(10,20);
+------------------------------------------+
| array_range(10, 20)                      |
+------------------------------------------+
| [10, 11, 12, 13, 14, 15, 16, 17, 18, 19] |
+------------------------------------------+

mysql> select array_range(0,20,2);
+-------------------------------------+
| array_range(0, 20, 2)               |
+-------------------------------------+
| [0, 2, 4, 6, 8, 10, 12, 14, 16, 18] |
+-------------------------------------+
```

### keywords

ARRAY, RANGE, ARRAY_RANGE
