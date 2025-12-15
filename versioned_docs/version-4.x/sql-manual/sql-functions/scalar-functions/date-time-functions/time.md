---
{
    "title": "TIME",
    "language": "en"
}
---

## Description
The `TIME` function get the Datetime value's `time` part.

## Syntax

```sql
TIME(<datetime>)
```

## Parameters

| Parameter      | Description           |
|----------------|-----------------------|
| `<datetime>`   | The datetime value.   |

## Return Value
Returns a `TIME` type value

## Example

```sql
SELECT TIME('2025-1-1 12:12:12');
```

```text
mysql> 
+---------------------------+
| time('2025-1-1 12:12:12') |
+---------------------------+
| 12:12:12                  |
+---------------------------+
```
