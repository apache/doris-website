---
{
    "title": "ARRAY_WITH_CONSTANT",
    "language": "en",
    "description": "Generates an array containing n repeated elements"
}
---

## Description

Generates an array containing n repeated elements

## Syntax

```sql
ARRAY_WITH_CONSTANT(<n>, <element>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<n>` | Number of digits |
| `<element>` | Specifying Elements |

## Return Value

Returns an array containing n repeated elements. array_repeat has the same function as array_with_constant and is used to be compatible with the hive syntax format.

## Example

```sql
SELECT ARRAY_WITH_CONSTANT(2, "hello"),ARRAY_WITH_CONSTANT(3, 12345);
```

```text
+---------------------------------+-------------------------------+
| array_with_constant(2, 'hello') | array_with_constant(3, 12345) |
+---------------------------------+-------------------------------+
| ["hello", "hello"]              | [12345, 12345, 12345]         |
+---------------------------------+-------------------------------+
```
