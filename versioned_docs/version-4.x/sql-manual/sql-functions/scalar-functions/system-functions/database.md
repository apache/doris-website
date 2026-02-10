---
{
    "title": "DATABASE",
    "language": "en",
    "description": "Get the database of the current sql client connection."
}
---

## Description

Get the database of the current sql client connection.

## Alias

- SCHEMA

## Syntax

```sql
DATABASE()
```
or

```sql
SCHEMA()
```

## Return Value

The name of the database connected to the current sql client.

## Examples

```sql
select database(),schema();
```

```text
+------------+------------+
| database() | database() |
+------------+------------+
| test       | test       |
+------------+------------+
```

