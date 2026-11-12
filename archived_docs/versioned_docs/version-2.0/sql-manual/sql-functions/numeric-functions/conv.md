---
{
    "title": "CONV",
    "language": "en"
}
---

## Description

Do radix conversion for input parameter.

## Syntax

```sql
CONV(<input>, <from_base>, <to_base>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<input>` | Parameters to be converted, either as strings or integers |
| `<from_base>` | Numeric, the source base, within `[2,36]`. |
| `<to_base>` | Numeric, the target base, within `[2,36]`. |

## Return Value

The number under the converted target binary `<to_base>` is returned as a string.

## Examples

```sql
SELECT CONV(15,10,2);
```

```text
+-----------------+
| conv(15, 10, 2) |
+-----------------+
| 1111            |
+-----------------+
```

```sql
SELECT CONV('ff',16,10);
```

```text
+--------------------+
| conv('ff', 16, 10) |
+--------------------+
| 255                |
+--------------------+
```

```sql
SELECT CONV(230,10,16);
```

```text
+-------------------+
| conv(230, 10, 16) |
+-------------------+
| E6                |
+-------------------+
```
