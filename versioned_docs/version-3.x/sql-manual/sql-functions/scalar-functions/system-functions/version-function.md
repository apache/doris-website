---
{
    "title": "VERSION",
    "language": "en"
}
---

## Description

No practical meaning, for compatibility with MySQL protocol.

## Syntax

```sql
VERSION()
```

## Return Value

Compatible with MySQL protocol, fixed return value is "5.7.99".

## Examples

```sql
select version();
```

```text
+-----------+
| version() |
+-----------+
| 5.7.99    |
+-----------+
```

