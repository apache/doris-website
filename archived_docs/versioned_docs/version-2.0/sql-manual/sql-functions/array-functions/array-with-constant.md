---
{
    "title": "ARRAY_WITH_CONSTANT",
    "language": "en"
}
---

## array_with_constant

array_with_constant

### description

#### Syntax

```sql
ARRAY<T> array_with_constant(n, T)
ARRAY<T> array_repeat(T, n)
```

get array of constants with n length, array_repeat has the same function as array_with_constant and is used to be compatible with the hive syntax format
### example

```
mysql> select array_with_constant(2, "hello"), array_repeat("hello", 2);
+---------------------------------+--------------------------+
| array_with_constant(2, 'hello') | array_repeat('hello', 2) |
+---------------------------------+--------------------------+
| ['hello', 'hello']              | ['hello', 'hello']       |
+---------------------------------+--------------------------+
1 row in set (0.04 sec)

mysql> select array_with_constant(3, 12345), array_repeat(12345, 3);
+-------------------------------+------------------------+
| array_with_constant(3, 12345) | array_repeat(12345, 3) | 
+-------------------------------+------------------------+
| [12345, 12345, 12345]         | [12345, 12345, 12345]  |
+-------------------------------+------------------------+
1 row in set (0.01 sec)

mysql> select array_with_constant(3, null), array_repeat(null, 3);
+------------------------------+-----------------------+
| array_with_constant(3, NULL) | array_repeat(NULL, 3) |
+------------------------------+-----------------------+
| [NULL, NULL, NULL]           |  [NULL, NULL, NULL]   |
+------------------------------+-----------------------+
1 row in set (0.01 sec)

mysql> select array_with_constant(null, 3), array_repeat(3, null);
+------------------------------+-----------------------+
| array_with_constant(NULL, 3) | array_repeat(3, NULL) |
+------------------------------+-----------------------+
| []                           | []                    |
+------------------------------+-----------------------+
1 row in set (0.01 sec)

```

### keywords

ARRAY,WITH_CONSTANT,ARRAY_WITH_CONSTANT,ARRAY_REPEAT
