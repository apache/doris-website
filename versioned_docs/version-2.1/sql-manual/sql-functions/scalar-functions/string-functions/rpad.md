---
{
    "title": "RPAD",
    "language": "en",
    "description": "Used to pad the specified character on the right side of the original string until met the specified length."
}
---

## Description

Used to pad the specified character on the right side of the original string until met the specified length.

## Syntax

```sql
RPAD ( <str> , <len> , <pad>)
```

## Parameters

| Parameter      | Description                                                                                                 |
|---------|-------------------------------------------------------------------------------------------------------------|
| `<str>` | The string to be padded.                                                                                    |
| `<len>` | The total length of the final result string, which represents character length rather than the byte length. |
| `<pad>` | The string used for padding.                                                                                |

:::tip
The maximum value of the `<len>` parameter is 10000. If this limit is exceeded, an error will be occurred. You can adjust the limit by setting the session variable:
```sql
set repeat_max_num = 20000
```
:::

## Return Value

Returns the padded string. Special cases:

- If any Parameter is NULL, NULL will be returned.
- If `<pad>` is empty and `<len>` is greater than the length of `<str>`, the return value is an empty string.
- If `<len>` is less than the length of `<str>`, the string obtained by truncating `<str>` to `<len>` is returned.
- If `<len>` is less than 0, the return value is NULL.

## Examples

```sql
SELECT rpad('hello', 1, '');
```

```text
+----------------------+
| rpad('hello', 1, '') |
+----------------------+
| h                    |
+----------------------+
```

```sql
SELECT rpad('hello', 10, 'world');
```

```text
+----------------------------+
| rpad('hello', 10, 'world') |
+----------------------------+
| helloworld                 |
+----------------------------+
```

```sql
SELECT rpad('hello', 10, '');
```

```text
+-----------------------+
| rpad('hello', 10, '') |
+-----------------------+
|                       |
+-----------------------+
```
