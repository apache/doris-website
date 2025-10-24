---
{
    "title": "STR_TO_MAP",
    "language": "en"
}
---

## Description

Constructs a `Map<String, String>` from a string.

:::tip
This function is supported since version 3.0.6.
:::

## Syntax

```sql
STR_TO_MAP(<str> [, <pair_delimiter> [, <key_value_delimiter>]])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | The string to be converted to a map |
| `<pair_delimiter>` | The delimiter for the pairs in the string, default is `,` |
| `<key_value_delimiter>` | The delimiter for the keys and values in the string, default is `:` |

## Return Value

Returns a `Map<String, String>` constructed from a string.

## Example

```sql
select str_to_map('a=1&b=2&c=3', '&', '=') as map1, str_to_map('x:10|y:20|z:30', '|', ':') as map2;
```

```text
+-----------------------------+--------------------------------+
| map1                        | map2                           |
+-----------------------------+--------------------------------+
| {"a":"1", "b":"2", "c":"3"} | {"x":"10", "y":"20", "z":"30"} |
+-----------------------------+--------------------------------+
```
