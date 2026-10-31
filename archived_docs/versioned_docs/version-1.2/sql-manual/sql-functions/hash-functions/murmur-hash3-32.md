---
{
    "title": "MURMUR_HASH3_32",
    "language": "en"
}
---

## murmur_hash3_32

### description
#### Syntax

`INT MURMUR_HASH3_32(VARCHAR input, ...)`

Return the 32 bits murmur3 hash of input string.

### example

```
mysql> select murmur_hash3_32(null);
+-----------------------+
| murmur_hash3_32(NULL) |
+-----------------------+
|                  NULL |
+-----------------------+

mysql> select murmur_hash3_32("hello");
+--------------------------+
| murmur_hash3_32('hello') |
+--------------------------+
|               1321743225 |
+--------------------------+

mysql> select murmur_hash3_32("hello", "world");
+-----------------------------------+
| murmur_hash3_32('hello', 'world') |
+-----------------------------------+
|                         984713481 |
+-----------------------------------+
```

### keywords

    MURMUR_HASH3_32,HASH
