---
{
    "title": "IS_VALID_UTF8",
    "language": "en",
    "description": "The IS_VALID_UTF8 function checks whether a string is valid UTF-8 encoded data. Returns true if the string is valid UTF-8, false otherwise."
}
---

## Description

The IS_VALID_UTF8 function checks whether a string is valid UTF-8 encoded data. It validates every byte sequence in the input and returns `true` if all sequences conform to the UTF-8 encoding standard, or `false` if any invalid byte sequence is found.

This is useful when dealing with data imported from external sources (files, network streams, etc.) that may contain binary or incorrectly encoded content, and you need to verify data integrity before performing string operations.

## Alias

- `ISVALIDUTF8()`

## Syntax

```sql
IS_VALID_UTF8(<str>)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<str>` | The string to validate. Type: VARCHAR or STRING |

## Return Value

Returns BOOLEAN type.

- Returns `true` if the string is valid UTF-8 encoded data.
- Returns `false` if the string contains any invalid UTF-8 byte sequence.

Special cases:
- If the parameter is NULL, returns NULL.
- An empty string is considered valid UTF-8, returns `true`.

## Examples

1. Valid ASCII strings

```sql
SELECT IS_VALID_UTF8('hello');
```

```text
+------------------------+
| is_valid_utf8('hello') |
+------------------------+
|                      1 |
+------------------------+
```

2. Valid multi-byte UTF-8 characters (Chinese)

```sql
SELECT IS_VALID_UTF8('Hello, 世界');
```

```text
+-----------------------------+
| is_valid_utf8('Hello, 世界') |
+-----------------------------+
|                           1 |
+-----------------------------+
```

3. Empty string

```sql
SELECT IS_VALID_UTF8('');
```

```text
+--------------------+
| is_valid_utf8('')  |
+--------------------+
|                  1 |
+--------------------+
```

4. Invalid UTF-8 bytes (constructed via UNHEX)

```sql
SELECT IS_VALID_UTF8(UNHEX('C0AF'));
```

```text
+------------------------------+
| is_valid_utf8(unhex('C0AF')) |
+------------------------------+
|                            0 |
+------------------------------+
```

5. NULL value handling

```sql
SELECT IS_VALID_UTF8(NULL);
```

```text
+---------------------+
| is_valid_utf8(NULL) |
+---------------------+
|                NULL |
+---------------------+
```

6. Using with table data

```sql
CREATE TABLE test_utf8 (
    id INT,
    val VARCHAR(200)
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO test_utf8 VALUES
(1, 'hello'),
(2, ''),
(3, 'Hello, 世界'),
(4, NULL);

INSERT INTO test_utf8 VALUES (5, UNHEX('C0AF'));
INSERT INTO test_utf8 VALUES (6, UNHEX('FF'));

SELECT id, IS_VALID_UTF8(val) FROM test_utf8 ORDER BY id;
```

```text
+------+--------------------+
| id   | is_valid_utf8(val) |
+------+--------------------+
|    1 |                  1 |
|    2 |                  1 |
|    3 |                  1 |
|    4 |               NULL |
|    5 |                  0 |
|    6 |                  0 |
+------+--------------------+
```
