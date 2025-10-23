---
{
    "title": "OVERLAY",
    "language": "en"
}
---

## Description

The OVERLAY function is used to replace a part of a string with another string.

## Syntax

```sql
OVERLAY(<str>, <pos>, <len>, <newstr>)
```

## Parameters

| Parameter | Description                                                                                                                                                                            |
| -- |----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<str>` | String that need to be replaced                                                                                                                                                        |
| `<pos>` | The starting position of the string that needs to be replaced. Starting from 1. If the input position is not within the length range of `<str>`, the replacement will not be performed |
| `<len>` | The length that needs to be replaced. When `<len>` is less than 0 or exceeds the length of the rest of the string, it will replace the rest of the string starting from `<pos>`        |
| `<newstr>` | String for replacement                                                                                                                                                                 |

## Return Value

Returns the string that replacing the specified length with a new string from the specified position. Special cases:

- If any Parameter is NULL, NULL will be returned.
- If `<pos>` is not within the length range of `<str>`, no replacement will be performed.
- When `<len>` is less than 0 or exceeds the length range of the remaining part of the `str`, the remaining string starting from `<pos>` will be replaced.

## Examples

```sql
select overlay('Quadratic', 3, 4, 'What');
```

```text
+------------------------------------+
| overlay('Quadratic', 3, 4, 'What') |
+------------------------------------+
| QuWhattic                          |
+------------------------------------+
```

```sql
select overlay('Quadratic', null, 4, 'What');
```

```text
+---------------------------------------+
| overlay('Quadratic', NULL, 4, 'What') |
+---------------------------------------+
| NULL                                  |
+---------------------------------------+
```

```sql
select overlay('Quadratic', -1, 4, 'What');
```

```text
+-------------------------------------+
| overlay('Quadratic', -1, 4, 'What') |
+-------------------------------------+
| Quadratic                           |
+-------------------------------------+
```

```sql
select overlay('Quadratic', 2, -4, 'What');
```

```text
+-------------------------------------+
| overlay('Quadratic', 2, -4, 'What') |
+-------------------------------------+
| QWhat                               |
+-------------------------------------+
```
