---
{
    "title": "DIGITAL_MASKING",
    "language": "en"
}
---

## Description

The `digital_masking` function is used for masking numbers. Based on the specified masking rule, certain characters in the number are replaced with *. This function is an alias for the original function `concat(left(id, 3), '****', right(id, 4))`.

## Syntax

```sql
DIGITAL_MASKING( <digital_number> )
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<digital_number>` | The digital string that needs to be masked |

## Return Value

Returns the masked digital string.

## Examples

```sql
select digital_masking(13812345678);
```

```
+------------------------------+
| digital_masking(13812345678) |
+------------------------------+
| 138****5678                  |
+------------------------------+
```
