---
{
    "title": "SHA1",
    "language": "en",
    "description": "Use the SHA1 algorithm to digest the information."
}
---

## Description

Use the SHA1 algorithm to digest the information.

## Alias
SHA

## Syntax

``` sql
SHA1( <str> )
```

## Parameters

| parameter | description         |
|-----------|-------------|
| `<str>`   | The sha1 value to be calculated |

## Return Value

Returns the sha1 value of the input string


## Examples

```sql
select sha("123"), sha1("123");
```

```text
+------------------------------------------+------------------------------------------+
| sha1('123')                              | sha1('123')                              |
+------------------------------------------+------------------------------------------+
| 40bd001563085fc35165329ea1ff5c5ecbdbbeef | 40bd001563085fc35165329ea1ff5c5ecbdbbeef |
+------------------------------------------+------------------------------------------+
```
