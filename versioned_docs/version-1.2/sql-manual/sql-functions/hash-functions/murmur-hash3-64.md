---
{
    "title": "MURMUR_HASH3_64",
    "language": "en"
}
---

## murmur_hash3_64

### description
#### Syntax

`BIGINT MURMUR_HASH3_64(VARCHAR input, ...)`

Return the 64 bits murmur3 hash of input string.

### example

```
mysql> select murmur_hash3_64(null);
+-----------------------+
| murmur_hash3_64(NULL) |
+-----------------------+
|                  NULL |
+-----------------------+

mysql> select murmur_hash3_64("hello");
+--------------------------+
| murmur_hash3_64('hello') |
+--------------------------+
|     -3215607508166160593 |
+--------------------------+

mysql> select murmur_hash3_64("hello", "world");
+-----------------------------------+
| murmur_hash3_64('hello', 'world') |
+-----------------------------------+
|               3583109472027628045 |
+-----------------------------------+
```

### keywords

    MURMUR_HASH3_64,HASH
