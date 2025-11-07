---
{
    "title": "MAKE_SET",
    "language": "en"
}
---

## Description

The MAKE_SET function selects and combines strings from multiple string parameters based on a bitmask (bit). Returns a comma-separated string set containing all strings whose corresponding bit is 1.

Behavior aligns with [MAKE_SET](https://dev.mysql.com/doc/refman/8.4/en/string-functions.html#function-make-set) in MySQL.

## Syntax

```sql
MAKE_SET(<bit>, <str1>[, <str2>, ...])
```

## Parameters

| Parameter | Description |
| -------- | ----------------------------------------- |
| `<bit>` | Bitmask value, binary bits indicate which strings to select. Type: BIGINT |
| `<str1>`, `<str2>`, ... | String parameters to be combined (variable arguments). Type: VARCHAR |

## Return Value

Returns VARCHAR type, a comma-separated string set.

Special cases:
- If `<bit>` is NULL, returns NULL
- If a string corresponding to a bit set to 1 is NULL, skip that string
- If corresponding bit exceeds parameter range, ignore that bit
- Binary bits count from right to left, bit 0 corresponds to the first string parameter
- When `<bit>` is 0, returns empty string

## Examples

1. Basic usage: bit = 3 (binary 011, selects bit 0 and bit 1)
```sql
SELECT make_set(3, 'dog', 'cat', 'bird');
```
```text
+-----------------------------------+
| make_set(3, 'dog', 'cat', 'bird') |
+-----------------------------------+
| dog,cat                           |
+-----------------------------------+
```

2. Skip NULL values: bit = 5 (binary 101, selects bit 0 and bit 2)
```sql
SELECT make_set(5, NULL, 'warm', 'hot');
```
```text
+---------------------------------+
| make_set(5, NULL, 'warm', 'hot') |
+---------------------------------+
| hot                             |
+---------------------------------+
```

3. bit is 0: Select no strings
```sql
SELECT make_set(0, 'hello', 'world');
```
```text
+--------------------------------+
| make_set(0, 'hello', 'world')  |
+--------------------------------+
|                                |
+--------------------------------+
```

4. NULL value handling
```sql
SELECT make_set(NULL, 'a', 'b', 'c');
```
```text
+-------------------------------+
| make_set(NULL, 'a', 'b', 'c') |
+-------------------------------+
| NULL                          |
+-------------------------------+
```

5. Bit exceeds parameter range: bit = 15 (binary 1111, selects 4 bits, but only 2 parameters)
```sql
SELECT make_set(15, 'first', 'second');
```
```text
+-------------------------------------+
| make_set(15, 'first', 'second')     |
+-------------------------------------+
| first,second                        |
+-------------------------------------+
```

6. UTF-8 special character support
```sql
SELECT make_set(7, 'ṭṛì', 'ḍḍumai', 'test');
```
```text
+------------------------------------------+
| make_set(7, 'ṭṛì', 'ḍḍumai', 'test')    |
+------------------------------------------+
| ṭṛì,ḍḍumai,test                          |
+------------------------------------------+
```

### Keywords

    MAKE_SET
