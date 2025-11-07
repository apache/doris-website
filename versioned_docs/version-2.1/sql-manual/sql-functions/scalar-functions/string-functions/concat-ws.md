---
{
    "title": "CONCAT_WS",
    "language": "en"
}
---

## Description

Use the first parameter sep as the connector to concatenate the second parameter and all subsequent parameters (or all strings in ARRAY) into a string. Special cases:

- If the separator is NULL, NULL is returned.

The `CONCAT_WS` function does not skip empty strings, but skips NULL values.

## Syntax

```sql
CONCAT_WS ( <sep> , <str> [ , <str> ] )
CONCAT_WS ( <sep> , <array> )
```

## Parameters

| Parameter | Description |
|-------|-----------------|
| `<sep>` | Connector for concatenating strings |
| `<str>` | String to be concatenated |
| `<array>` | Array to be concatenated |

## Return value

Parameter `<sep>` or `<array>` The string concatenated with `<str>`. Special cases:

- If delimiter is NULL, returns NULL.

## Example

Concatenate strings together using or

```sql
SELECT CONCAT_WS("or", "d", "is"),CONCAT_WS(NULL, "d", "is"),CONCAT_WS('or', 'd', NULL, 'is')
```

```text
+----------------------------+----------------------------+------------------------------------------+
| concat_ws('or', 'd', 'is') | concat_ws(NULL, 'd', 'is') | concat_ws('or', 'd', NULL, 'is') |
+----------------------------+----------------------------+------------------------------------------+
| doris                      | NULL                       | doris                              |
+----------------------------+----------------------------+------------------------------------------+
```

Concatenate array arrays together using or

```sql
SELECT CONCAT_WS("or", ["d", "is"]),CONCAT_WS(NULL, ["d", "is"]),CONCAT_WS("or", ["d", NULL,"is"])
```

```text
+------------------------------+------------------------------+------------------------------------+
| concat_ws('or', ['d', 'is']) | concat_ws(NULL, ['d', 'is']) | concat_ws('or', ['d', NULL, 'is']) |
+------------------------------+------------------------------+------------------------------------+
| doris                        | NULL                         | doris                              |
+------------------------------+------------------------------+------------------------------------+
```