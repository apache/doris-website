---
{
    "title": "PROTOCOL",
    "language": "en"
}
---

## Description

The PROTOCOL function is mainly used to extract the protocol part from a URL string.

## Syntax

```sql
PROTOCOL( <url> )
```

## Parameters

| Parameter      | Description         |
|---------|------------|
| `<url>` | The URL to be parsed |

## Return Value

Returns the protocol part of the <url>. Special cases:

- If any of the parameters is NULL, NULL is returned.

## Examples

```sql
SELECT protocol('https://doris.apache.org/');
```

```text
+---------------------------------------+
| protocol('https://doris.apache.org/') |
+---------------------------------------+
| https                                 |
+---------------------------------------+
```

```sql
SELECT protocol(null);
```

```text
+----------------+
| protocol(NULL) |
+----------------+
| NULL           |
+----------------+
```

## 相关命令

If you want to extract other parts of the URL, you can use [parse_url](./parse-url.md)。
