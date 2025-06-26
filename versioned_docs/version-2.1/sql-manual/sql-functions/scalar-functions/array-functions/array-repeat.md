---
{
    "title": "ARRAY_REPEAT",
    "language": "en"
}
---

## Description

Generates an array containing n repeated elements

## Syntax

```sql
ARRAY_REPEAT(<element>, <n>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<n>` | Number of digits |
| `<element>` | Specifying Elements |

## Return Value

Returns an array containing n repeated elements. array_with_constant has the same function as array_repeat and is used to be compatible with the hive syntax format.

## Example

```sql
SELECT ARRAY_REPEAT("hello", 2),ARRAY_REPEAT(12345, 3);
```

```text
+--------------------------+------------------------+
| array_repeat('hello', 2) | array_repeat(12345, 3) |
+--------------------------+------------------------+
| ["hello", "hello"]       | [12345, 12345, 12345]  |
+--------------------------+------------------------+
```
