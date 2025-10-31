---
{
    "title": "POSITIVE",
    "language": "en"
}
---

## Description

Returns the value itself.

## Syntax

```sql
POSITIVE(<x>)
```

## Parameters

| Parameter | Description |
|-----------|------------|
| `<x>`   | The value that needs to be returned. |

## Return value

Returns an integer or a floating-point number. Special cases:

- If the parameter is NULL, return NULL.

## Example

```sql
SELECT positive(-10);
```

```text
+---------------+
| positive(-10) |
+---------------+
|           -10 |
+---------------+
```

```sql
SELECT positive(10.111);
```

```text
+------------------+
| positive(10.111) |
+------------------+
|           10.111 |
+------------------+
```

```sql
SELECT positive(12);
```

```text
+--------------+
| positive(12) |
+--------------+
|           12 |
+--------------+
```

```sql
SELECT positive(null);
```

```text
+----------------+
| positive(NULL) |
+----------------+
|           NULL |
+----------------+
```