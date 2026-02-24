---
{
    "title": "INT_TO_UUID",
    "language": "en",
    "description": "For an encoded LARGEINT input, convert it to a raw uuid string."
}
---

## Description

For an encoded LARGEINT input, convert it to a raw uuid string.

## Syntax

```sql
INT_TO_UUID ( <int128> )
```

## Parameters

| Parameter  | Description |
|------------|-----------------|
| `<int128>` | Encoded LARGEINT value |

## Return value

Parameter `<int128>` Raw uuid string.

## Example

```sql
SELECT INT_TO_UUID(95721955514869408091759290071393952876)
```

```text
+-----------------------------------------------------+
| int_to_uuid(95721955514869408091759290071393952876) |
+-----------------------------------------------------+
| 6ce4766f-6783-4b30-b357-bba1c7600348                |
+-----------------------------------------------------+
```
