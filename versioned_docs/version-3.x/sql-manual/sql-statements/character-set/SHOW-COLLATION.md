---
{
    "title": "SHOW COLLATION",
    "language": "en",
    "description": "In Doris, the SHOW COLLATION command is used to display the character set collations available in the database."
}
---

## Description

In Doris, the SHOW COLLATION command is used to display the character set collations available in the database. A collation is a set of rules that determine how data is sorted and compared. These rules affect the storage and retrieval of character data.

## Syntax

```sql
SHOW COLLATION
```

## Return Value

| column name | description  |
| -- |--------------|
| Collation | The collation name         |
| Charset | The character set          |
| Id | The collation's ID        |
| Default | Whether this is the default collation for the character set |
| Compiled | Whether the collation is compiled        |
| Sortlen | Sort length         |



## Usage Notes

In Doris, although it is compatible with the MySQL collation setting command, it does not actually take effect. When executed, utf8mb4_0900_bin will always be used as the comparison rule.

## Examples

```sql
SHOW COLLATION;
```

```text
+--------------------+---------+------+---------+----------+---------+
| Collation          | Charset | Id   | Default | Compiled | Sortlen |
+--------------------+---------+------+---------+----------+---------+
| utf8mb4_0900_bin   | utf8mb4 |  309 | Yes     | Yes      |       1 |
| utf8mb3_general_ci | utf8mb3 |   33 | Yes     | Yes      |       1 |
+--------------------+---------+------+---------+----------+---------+
```