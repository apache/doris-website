---
{
    "title": "SM3",
    "language": "en",
    "description": "Calculation SM3 256-bit"
}
---

## Description

Calculation SM3 256-bit

## Syntax

```sql
SM3( <str> )
```

## Parameters


| parameter | description |
|-----------|-------------|
| `<str>`   | The value of sm3 that needs to be calculated  |

## Return Value
Returns the sm3 value of the input string

## Examples

```sql
select sm3("abcd");
```

```text
+------------------------------------------------------------------+
| sm3('abcd')                                                      |
+------------------------------------------------------------------+
| 82ec580fe6d36ae4f81cae3c73f4a5b3b5a09c943172dc9053c69fd8e18dca1e |
+------------------------------------------------------------------+
```
