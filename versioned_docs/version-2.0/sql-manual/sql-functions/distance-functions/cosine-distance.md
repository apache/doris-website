---
{
    "title": "COSINE_DISTANCE",
    "language": "en"
}
---

## cosine_distance

### description
#### Syntax

```sql
DOUBLE cosine_distance(ARRAY<T> array1, ARRAY<T> array2)
```

Calculates the cosine distance between two vectors (the values of the vectors are the coordinates).
Return NULL if input array is NULL or any element of array is NULL.

#### Notice
* nested type of input array support: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE
* input array1 and array2 should have the same element size

### example

```
sql> SELECT cosine_distance([1, 2], [2, 3]);
+-------------------------------------------+
| cosine_distance(ARRAY(1, 2), ARRAY(2, 3)) |
+-------------------------------------------+
|                     0.0077221232863322609 |
+-------------------------------------------+
```

### keywords
	COSINE_DISTANCE,DISTANCE,COSINE,ARRAY
