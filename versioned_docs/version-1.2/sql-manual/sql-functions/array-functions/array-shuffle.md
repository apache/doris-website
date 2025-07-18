---
{
    "title": "ARRAY_SHUFFLE",
    "language": "en"
}
---

## array_shuffle

<version since="2.0">

array_shuffle
shuffle

</version>

### description

#### Syntax

```sql
ARRAY<T> array_shuffle(ARRAY<T> array1, [INT seed])
ARRAY<T> shuffle(ARRAY<T> array1, [INT seed])
```

Randomly arrange the elements in the array. Among them, the parameter array1 is the array to be randomly arranged, and the optional parameter seed is to set the initial value used by the pseudo-random number generator to generate pseudo-random numbers.
Shuffle has the same function as array_shuffle.

```
array_shuffle(array1);
array_shuffle(array1, 0);
shuffle(array1);
shuffle(array1, 0);
```

### example

```sql

mysql [test]> select c_array1, array_shuffle(c_array1) from array_test; 
+-----------------------+---------------------------+
| c_array1              | array_shuffle(`c_array1`) |
+-----------------------+---------------------------+
| [1, 2, 3, 4, 5, NULL] | [2, NULL, 5, 3, 4, 1]     |
| [6, 7, 8, NULL]       | [7, NULL, 8, 6]           |
| [1, NULL]             | [1, NULL]                 |
| NULL                  | NULL                      |
+-----------------------+---------------------------+
4 rows in set (0.01 sec)

MySQL [test]> select c_array1, array_shuffle(c_array1, 0) from array_test; 
+-----------------------+------------------------------+
| c_array1              | array_shuffle(`c_array1`, 0) |
+-----------------------+------------------------------+
| [1, 2, 3, 4, 5, NULL] | [1, 3, 2, NULL, 4, 5]        |
| [6, 7, 8, NULL]       | [6, 8, 7, NULL]              |
| [1, NULL]             | [1, NULL]                    |
| NULL                  | NULL                         |
+-----------------------+------------------------------+
4 rows in set (0.01 sec)

```

### keywords

ARRAY,ARRAY_SHUFFLE,SHUFFLE
