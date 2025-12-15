---
{
"title": "SM3SUM",
"language": "en"
}
---

## Description

Calculate multiple strings SM3 256-bit

## Syntax

```sql
SM3SUM( <str> [ , <str> ... ] )
```

## Parameters

| parameter | description |
|-----------|-------------|
| `<str>`   | The value of sm3 that needs to be calculated   |

## Return Value

Returns the sm3 value of the input multiple strings

## Examples

```sql
select sm3sum("ab","cd");
```

```text
+------------------------------------------------------------------+
| sm3sum('ab', 'cd')                                               |
+------------------------------------------------------------------+
| 82ec580fe6d36ae4f81cae3c73f4a5b3b5a09c943172dc9053c69fd8e18dca1e |
+------------------------------------------------------------------+
```
