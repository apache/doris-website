---
{
    "title": "XOR | Bitwise Functions",
    "language": "en",
    "description": "Performs a bitwise exclusive OR operation on two BOOLEAN values."
}
---

# XOR

## Description
Performs a bitwise exclusive OR operation on two BOOLEAN values.

## Syntax
```sql
 <lhs> XOR <rhs>
```

## Parameters
| parameter | description                                                             |
|-----------|-------------------------------------------------------------------------|
| `<lhs>`   | The first BOOLEAN value to be evaluated                                 |
| `<rhs>`   | The second BOOLEAN value to be evaluated |

## Return Value
Returns the exclusive OR of two BOOLEAN values.

## Examples
```sql
select true XOR false,true XOR true;
```

```text
+------------------+-----------------+
| xor(TRUE, FALSE) | xor(TRUE, TRUE) |
+------------------+-----------------+
|                1 |               0 |
+------------------+-----------------+
```

