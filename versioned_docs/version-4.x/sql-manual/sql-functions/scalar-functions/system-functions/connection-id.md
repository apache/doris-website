---
{
    "title": "CONNECTION_ID",
    "language": "en",
    "description": "Get the connection number of the current sql client."
}
---

## Description

Get the connection number of the current sql client.

## Syntax

```sql
CONNECTION_ID()
```

## Return Value

The connection number of the current sql client.

## Examples

```sql
select connection_id();
```

```text
+-----------------+
| connection_id() |
+-----------------+
|             549 |
+-----------------+
```
