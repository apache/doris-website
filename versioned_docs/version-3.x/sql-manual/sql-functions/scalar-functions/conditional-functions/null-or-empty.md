---
{
    "title": "NULL_OR_EMPTY",
    "language": "en",
    "description": "The nullorempty function checks if the given value is NULL or an empty string. It returns true if the input value is NULL or an empty string,"
}
---

## Description

The `null_or_empty` function checks if the given value is NULL or an empty string. It returns true if the input value is NULL or an empty string, otherwise, it returns false.

## Syntax

```sql
NULL_OR_EMPTY (<str>)
```

## Parameters

| Parameter | Description            |
| --------- | ---------------------- |
| `<str>`   | The string to check.   |

## Return Value

Returns true if the string is an empty string or NULL, otherwise returns false.

## Examples

```sql
select null_or_empty(null);
```

```text
+---------------------+
| null_or_empty(NULL) |
+---------------------+
|                   1 |
+---------------------+
```

```sql
select null_or_empty("");
```

```text
+-------------------+
| null_or_empty('') |
+-------------------+
|                 1 |
+-------------------+
```

```sql
select null_or_empty("a");
```

```text
+--------------------+
| null_or_empty('a') |
+--------------------+
|                  0 |
+--------------------+
```