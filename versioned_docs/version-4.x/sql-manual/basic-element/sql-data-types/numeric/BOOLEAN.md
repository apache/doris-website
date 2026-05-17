---
{
    "title": "BOOLEAN",
    "language": "en",
    "description": "BOOL, BOOLEAN Like TINYINT, 0 stands for false and 1 for true."
}
---

## Description

BOOLEAN (alias: BOOL) is a data type in Doris that represents boolean values: true and false.

Internally, BOOLEAN is stored as a uint8 value, where 0 represents false and 1 represents true.

Unlike MySQL where BOOLEAN is an alias for TINYINT(1), Doris treats BOOLEAN as a separate data type, similar to PostgreSQL, Oracle, and other database systems.

## Value Range

BOOLEAN values can only be:
- `true` (represented as 1 when displayed)
- `false` (represented as 0 when displayed)

In memory, BOOLEAN type only exists as 0 or 1, with no other possible values.

## Literal Values

In Doris, you can use the keywords `true` and `false` (case-insensitive) to represent boolean literal values:

```sql
mysql> select TrUe, False, true;
+------+-------+------+
| TrUe | False | true |
+------+-------+------+
|    1 |     0 |    1 |
+------+-------+------+
```

## Supported Operations

### Logical Operations

BOOLEAN type supports logical operations such as AND, OR, NOT, and XOR:

```sql
mysql> select true AND false, true OR false, NOT true, true XOR false;
+----------------+---------------+----------+----------------+
| true AND false | true OR false | NOT true | true XOR false |
+----------------+---------------+----------+----------------+
|              0 |             1 |        0 |              1 |
+----------------+---------------+----------+----------------+
```

### Arithmetic Operations

While BOOLEAN doesn't directly support arithmetic operations, expressions like `true + true` will work due to implicit type conversion:

```sql
mysql> select true + true;
+-------------+
| true + true |
+-------------+
|           2 |
+-------------+
```

This works because the boolean values are implicitly cast to SMALLINT: `CAST(TRUE AS smallint) + CAST(TRUE AS smallint)`.

## Type Conversion

It's important to note that BOOLEAN is not equivalent to TINYINT in Doris, even though they may appear similar due to MySQL conventions.

When inserting a boolean literal into a TINYINT column, implicit type conversion occurs:

```sql
CREATE TABLE test_boolean(
    u8 TINYINT
)
properties("replication_num" = "1");

mysql> insert into test_boolean values(true);
```

In this example, the boolean literal `true` is converted to a TINYINT value.

## Keywords

BOOL, BOOLEAN
