---
{
    "title": "TO_HEX",
    "language": "en"
}
---

## Description

Convert the input string into the corresponding byte sequence in hexadecimal.

## Alias

TO_BINARY

## Syntax

```sql
TO_HEX(<str>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | The string data to be converted |

## Return Value

Return the decoded VARBINARY (displayed in hexadecimal format with a 0x prefix).
Return NULL if any of the following conditions are met:
The input is NULL;
The input length is 0;
The input length is odd;
The input contains characters other than [0-9a-fA-F];
The length of the decoded result is 0 (decoding failed).

## Examples

```sql
select to_hex(NULL),to_hex('a');
```

```text
+----------------------------+--------------------------+
| to_hex(NULL)               | to_hex('a')              |
+----------------------------+--------------------------+
| NULL                       | NULL                     |
+----------------------------+--------------------------+
```

```sql
select to_hex('ab');
```

```text
+----------------------------+
| to_hex('ab')               |
+----------------------------+
| 0xAB                       |
+----------------------------+
```

```sql
select to_hex('000A');
```

```text
+--------------------------------+
| to_hex('000A')                 |
+--------------------------------+
| 0x000A                         |
+--------------------------------+
```
