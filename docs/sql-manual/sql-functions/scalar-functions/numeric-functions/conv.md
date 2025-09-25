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
When any input parameter is NULL, returns NULL.
If `<from_base>` or `<to_base>` does not meet the range requirement, returns NULL.

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

```sql
SELECT CONV(230,10,NULL);
```

```text
+-------------------+
| CONV(230,10,NULL) |
+-------------------+
| NULL              |
+-------------------+
```

```sql
SELECT CONV(230,10,56);
```

```text
+-----------------+
| CONV(230,10,56) |
+-----------------+
| NULL            |
+-----------------+
```
