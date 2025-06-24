---
{
    "title": "REVERSE",
    "language": "en"
}
---

## Description

The REVERSE function is used to reverse the order of characters in a string or the order of elements in an array.

## Syntax

```sql
REVERSE( <seq> )
```

## Parameters

| Parameter | Description             |
|-----------|----------------|
| `<seq>`   | The string or array whose order needs to be reversed. |

## Return Value

Returns the string or array with the reversed order. Special cases:

- If any Parameter is NULL, NULL will be returned.

## Examples

```sql
SELECT reverse('hello');
```

```text
+------------------+
| REVERSE('hello') |
+------------------+
| olleh            |
+------------------+
```

```sql
SELECT reverse(['hello', 'world']);
```

```text
+-----------------------------+
| reverse(['hello', 'world']) |
+-----------------------------+
| ["world", "hello"]          |
+-----------------------------+
```
