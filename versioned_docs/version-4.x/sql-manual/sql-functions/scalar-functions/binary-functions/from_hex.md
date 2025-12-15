---
{
    "title": "FROM_HEX",
    "language": "en"
}
---

## Description

Convert the input binary data into a string converted using hexadecimal encoding.

## Alias

FROM_BINARY

## Syntax

```sql
FROM_HEX ( <varbinary> )
```

## Parameters

| Parameter | Description |
|-------|--------------|
| `<varbinary>` | Input parameter is binary data |

## Return value

Convert the input binary data into a string using hexadecimal encoding.

## Example

```sql
SELECT FROM_HEX(NULL);
```

```text
+----------------+
| FROM_HEX(NULL) |
+----------------+
| NULL           |
+----------------+
```

```sql
SELECT FROM_HEX(X'AB');
```

```text
+-----------------+
| FROM_HEX(X'AB') |
+-----------------+
| AB              |
+-----------------+
```

```sql
select *, from_binary(varbinary_c) from mysql_all_type_test.test_varbinary_db.test_varbinary
```

```text
+------+----------------------------+--------------------------+
| id   | varbinary_c                | from_binary(varbinary_c) |
+------+----------------------------+--------------------------+
|    1 | 0x48656C6C6F20576F726C64   | 48656C6C6F20576F726C64   |
|    2 | 0x48656C6C6F20576F726C6421 | 48656C6C6F20576F726C6421 |
|    3 | 0x48656C6C6F20576F726C6421 | 48656C6C6F20576F726C6421 |
|    4 | NULL                       | NULL                     |
|    5 | 0xAB                       | AB                       |
+------+----------------------------+--------------------------+
```