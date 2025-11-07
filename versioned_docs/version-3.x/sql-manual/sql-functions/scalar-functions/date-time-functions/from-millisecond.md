---
{
    "title": "FROM_MILLISECOND",
    "language": "en"
}
---

## Description

The function converts a Unix timestamp (in milliseconds) into a `DATETIME` value.

## Syntax

```sql
FROM_MILLISECOND(<millisecond>)
```
## Parameters

| Parameter       | Description                                                                                                 |
|-----------------|-------------------------------------------------------------------------------------------------------------|
| `<millisecond>` | Required. The Unix timestamp representing the number of milliseconds elapsed since 1970-01-01 00:00:00 UTC. |

## Return Value

- Returns a DATETIME value representing the date and time corresponding to the given Unix timestamp.
- If <millisecond> is NULL, the function returns NULL.
- If <millisecond> is out of valid range, the function returns an error.

## Example

```sql
SELECT FROM_MILLISECOND(1700000000000);
```

```text
+---------------------------------+
| from_millisecond(1700000000000) |
+---------------------------------+
| 2023-11-15 06:13:20             |
+---------------------------------+
```

