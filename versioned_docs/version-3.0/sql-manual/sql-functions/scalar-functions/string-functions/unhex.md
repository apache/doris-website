---
{
    "title": "UNHEX",
    "language": "en"
}
---

## Description

The `unhex` function is used to convert a hexadecimal string back into the original string. It converts every two hexadecimal characters into one byte. When an invalid value is passed as a parameter, it will return empty string.
The `unhex_null` function has the same effect as the `unhex` function. However, when an invalid value is passed as a parameter, it will return NULL.

:::tip
The `unhex_null` function is supported since version 3.0.6. 
:::

## Syntax

```sql
UNHEX(<str>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | The hexadecimal character string |

## Return Value

If the input string has a length of 0 or is odd, `unhex` function returns an empty string while `unhex_null` function returns `NULL`.
If the string contains characters other than [0-9], [a-f], or [A-F], `unhex` function returns an empty string while `unhex_null` function returns `NULL`.
In other cases, every two characters are converted to their hexadecimal representation and concatenated into a string for output.

## Examples

```sql
select unhex('@');
```

```text
+------------+
| unhex('@') |
+------------+
|            |
+------------+
```

```sql
select unhex_null('@');
```

```text
+-----------------+
| unhex_null('@') |
+-----------------+
| NULL            |
+-----------------+
```

```sql
select unhex('41');
```

```text
+-------------+
| unhex('41') |
+-------------+
| A           |
+-------------+
```

```sql
select unhex('4142');
```

```text
+---------------+
| unhex('4142') |
+---------------+
| AB            |
+---------------+
```
