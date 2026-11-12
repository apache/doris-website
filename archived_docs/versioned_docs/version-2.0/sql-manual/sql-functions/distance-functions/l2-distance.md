---
{
    "title": "L2_DISTANCE",
    "language": "en"
}
---

## l2_distance

### description
#### Syntax

```sql
DOUBLE l2_distance(ARRAY<T> array1, ARRAY<T> array2)
```

Calculates the distance between two points (the values of the vectors are the coordinates) in Euclidean space.
Return NULL if input array is NULL or any element of array is NULL.

#### Notice
* nested type of input array support: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE
* input array1 and array2 should have the same element size

### example

```
sql> SELECT l2_distance([1, 2], [2, 3]);
+---------------------------------------+
| l2_distance(ARRAY(1, 2), ARRAY(2, 3)) |
+---------------------------------------+
|                    1.4142135623730951 |
+---------------------------------------+
```

### keywords
	L2_DISTANCE,DISTANCE,L2,ARRAY
