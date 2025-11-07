---
{
    "title": "FROM_SECOND",
    "language": "en"
}
---

## Description
The function converts a Unix timestamp (in seconds) into a `DATETIME` value.


## Syntax

```sql
FROM_SECOND(<unix_timestamp>)
```
## Parameters

| Parameter          | Description                                                                                            |
|--------------------|--------------------------------------------------------------------------------------------------------|
| `<unix_timestamp>` | Required. The Unix timestamp representing the number of seconds elapsed since 1970-01-01 00:00:00 UTC. |

## Return Value
- Returns a DATETIME value representing the date and time corresponding to the given Unix timestamp.
- If `<unix_timestamp>` is NULL, the function returns NULL.
- If `<unix_timestamp>` is out of valid range, the function returns an error.

## Example

```sql
SELECT FROM_SECOND(1700000000);
```

```text
+-------------------------+
| from_second(1700000000) |
+-------------------------+
| 2023-11-15 06:13:20     |
+-------------------------+
```