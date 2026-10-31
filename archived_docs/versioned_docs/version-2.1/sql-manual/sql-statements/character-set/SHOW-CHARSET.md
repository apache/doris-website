---
{
    "title": "SHOW CHARSET",
    "language": "en",
    "description": "The \"SHOW CHARSET\" command is used to display the character sets available in the current database management system and some properties associated "
}
---

## Description

The "SHOW CHARSET" command is used to display the character sets available in the current database management system and some properties associated with each character set.

These properties may include the name of the character set, default collation, maximum byte length, etc. A list of character sets supported on the system and their details can be viewed by running the "SHOW CHARSET" command.

## Syntax
```sql
SHOW CHARSET
```

## Return Value
| column name | description |
| -- |-------------|
| Charset | Character Set         |
| Description | Description          |
| Default Collation | Default collation name      |
| Maxlen | Maximum byte length      |

## Examples

```sql
SHOW CHARSET;
```

```text
+---------+---------------+-------------------+--------+
| Charset | Description   | Default collation | Maxlen |
+---------+---------------+-------------------+--------+
| utf8mb4 | UTF-8 Unicode | utf8mb4_0900_bin  | 4      |
+---------+---------------+-------------------+--------+
```

