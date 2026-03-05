---
{
    "title": "L1_DISTANCE",
    "language": "en"
}
---

## l1_distance

### description
#### Syntax

```sql
DOUBLE l1_distance(ARRAY<T> array1, ARRAY<T> array2)
```

Calculates the distance between two points (the values of the vectors are the coordinates) in L1 space.
Return NULL if input array is NULL or any element of array is NULL.

#### Notice
* nested type of input array support: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE
* input array1 and array2 should have the same element size

### example

```
sql> SELECT l1_distance([1, 2], [2, 3]);
+---------------------------------------+
| l1_distance(ARRAY(1, 2), ARRAY(2, 3)) |
+---------------------------------------+
|                                     2 |
+---------------------------------------+
```

### keywords
	L1_DISTANCE,DISTANCE,L1,ARRAY
