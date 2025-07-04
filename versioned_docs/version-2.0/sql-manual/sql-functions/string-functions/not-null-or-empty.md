---
{
    "title": "NOT_NULL_OR_EMPTY",
    "language": "en"
}
---

## Description

The `not_null_or_empty` function checks if the given value is neither NULL nor empty. It returns true if the input value is not NULL and not an empty string, otherwise, it returns false.

## Syntax

```sql
NOT_NULL_OR_EMPTY (<str>)
```

## Parameters

| Parameter | Description         |
| --------- | ------------------- |
| `<str>`   | The string to check |

## Return Value

Returns false if the string is an empty string or NULL, otherwise returns true.

## Examples

```sql
select not_null_or_empty(null);
```

```text
+-------------------------+
| not_null_or_empty(NULL) |
+-------------------------+
|                       0 |
+-------------------------+
```

```sql
select not_null_or_empty("");
```

```text
+-----------------------+
| not_null_or_empty('') |
+-----------------------+
|                     0 |
+-----------------------+
```

```sql
select not_null_or_empty("a");
```

```text
+------------------------+
| not_null_or_empty('a') |
+------------------------+
|                      1 |
+------------------------+
```