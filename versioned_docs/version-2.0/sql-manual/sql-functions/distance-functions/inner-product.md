---
{
    "title": "INNER_PRODUCT",
    "language": "en"
}
---

## inner_product

### description
#### Syntax

```sql
DOUBLE inner_product(ARRAY<T> array1, ARRAY<T> array2)
```

Calculates the scalar product of two vectors of the same size.
Return NULL if input array is NULL or any element of array is NULL.

#### Notice
* nested type of input array support: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE
* input array1 and array2 should have the same element size

### example

```
sql> SELECT inner_product([1, 2], [2, 3]);
+-----------------------------------------+
| inner_product(ARRAY(1, 2), ARRAY(2, 3)) |
+-----------------------------------------+
|                                       8 |
+-----------------------------------------+
```

### keywords
	INNER_PRODUCT,DISTANCE,ARRAY
