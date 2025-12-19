---
{
    "title": "HOUR",
    "language": "en",
    "description": "Obtains the hour information from the given datetime."
}
---

## Description

Obtains the hour information from the given datetime.

## Syntax

```sql
HOUR(<dt>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<dt>` | The date to be calculated. |

## Return Value

Returns the hour information from the given date. The return value ranges from 0 to 23. When the parameter is of type TIME, the return value can be greater than 24.

## Examples

```sql
select hour('2018-12-31 23:59:59');
```

```text
+-----------------------------+
| hour('2018-12-31 23:59:59') |
+-----------------------------+
|                          23 |
+-----------------------------+
```

```sql
select cast(4562632 as time),hour(cast(4562632 as time)), minute(cast(4562632 as time)),second(cast(4562632 as time));
```

```text
+-----------------------+-----------------------------+-------------------------------+-------------------------------+
| cast(4562632 as TIME) | hour(cast(4562632 as TIME)) | minute(cast(4562632 as TIME)) | second(cast(4562632 as TIME)) |
+-----------------------+-----------------------------+-------------------------------+-------------------------------+
| 456:26:32             |                         456 |                            26 |                            32 |
+-----------------------+-----------------------------+-------------------------------+-------------------------------+
```
