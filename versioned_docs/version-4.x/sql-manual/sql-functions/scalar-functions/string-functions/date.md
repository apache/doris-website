---
{
    "title": "DATE",
    "language": "en",
    "description": "Extracts the date from the datetime."
}
---

## Description

Extracts the date from the datetime.

## Syntax

```sql
DATE DATE(DATETIME datetime)
```

## Parameters

| Parameter | Description |
| -- | -- |
| datetime | A valid date expression |

## Return Value

Returns the date part of the datetime.

## Examples

```sql
select date('2010-12-02 19:28:30');
```

```text
+----------------------------------------------------+
| date(cast('2010-12-02 19:28:30' as DATETIMEV2(0))) |
+----------------------------------------------------+
| 2010-12-02                                         |
+----------------------------------------------------+
```