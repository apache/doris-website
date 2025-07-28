---
{
    "title": "REPEAT",
    "language": "en"
}
---

## Description

The REPEAT function is used to repeat a string a specified number of times.

## Syntax

```sql
REPEAT( <str>, <count> )
```

## Parameters

| Parameter | Description                                                                                                               |
|-----------|---------------------------------------------------------------------------------------------------------------------------|
| `<str>`   | The string to be repeated.                                                                                                |
| `<count>` | The number of times to repeat. It must be a non-negative integer. If it is less than 1, an empty string will be returned. |

:::tip
The repeat function defaults to a maximum of 10,000 repetitions. If this number is exceeded, an error will be reported. The limit can be adjusted through a session variable:
```sql
set repeat_max_num = 20000
```
:::

## Return Value

Returns the string repeated the specified number of times. Special cases:

- If any Parameter is NULL, NULL will be returned.

## Examples

```sql
SELECT repeat("a", 3);
```

```text
+----------------+
| repeat('a', 3) |
+----------------+
| aaa            |
+----------------+
```

```sql
SELECT repeat("a", -1);
```

```text
+-----------------+
| repeat('a', -1) |
+-----------------+
|                 |
+-----------------+
```
