---
{
    "title": "TIME | Date Time Functions",
    "language": "en",
    "description": "The TIME function get the Datetime value's time part.",
    "sidebar_label": "TIME"
}
---

# TIME

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

