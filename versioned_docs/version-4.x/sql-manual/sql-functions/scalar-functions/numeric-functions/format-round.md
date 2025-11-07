---
{
    "title": "FORMAT_ROUND",
    "language": "en"
}
---

## Description

Formats a number in a format similar to "#,###,###.##", rounds to the specified decimal places, and returns the result as a string.

:::tip
This function is supported since version 3.0.6. 
:::

## Syntax

```sql
FORMAT_ROUND(<number>, <D>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<number>` | The number to be formatted |
| `<D>` | Number of decimal places, range [0, 1024] |

## Return Value

Returns the formatted string. Special cases:

- Returns NULL when the parameter is NULL
- If D is 0, the result will have no decimal point or decimal part.
- If D is not in [0, 1024], an error is returned indicating the argument should be within this range.

## Examples

```sql
mysql> select format_round(17014116, 2);
+---------------------------+
| format_round(17014116, 2) |
+---------------------------+
| 17,014,116.00             |
+---------------------------+
```

```sql
mysql> select format_round(1123.456, 2);
+---------------------------+
| format_round(1123.456, 2) |
+---------------------------+
| 1,123.46                  |
+---------------------------+
```

```sql
mysql> select format_round(1123.4, 2);
+-------------------------+
| format_round(1123.4, 2) |
+-------------------------+
| 1,123.40                |
+-------------------------+
```

```sql
mysql> select format_round(123456, 0);
+-------------------------+
| format_round(123456, 0) |
+-------------------------+
| 123,456                 |
+-------------------------+
```

```sql
mysql> select format_round(123456, 3);
+-------------------------+
| format_round(123456, 3) |
+-------------------------+
| 123,456.000             |
+-------------------------+
```

```sql
mysql> select format_round(123456.123456, 0);
+--------------------------------+
| format_round(123456.123456, 0) |
+--------------------------------+
| 123,456                        |
+--------------------------------+
```

```sql
mysql> select format_round(123456.123456, 3);
+--------------------------------+
| format_round(123456.123456, 3) |
+--------------------------------+
| 123,456.123                    |
+--------------------------------+
```

```sql
mysql> select format_round(123456.123456, 6);
+--------------------------------+
| format_round(123456.123456, 6) |
+--------------------------------+
| 123,456.123456                 |
+--------------------------------+
```

```sql
mysql> SELECT format_round(-0.01, -1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]The second argument is -1, it should be in range [0, 1024].
mysql> SELECT format_round(-0.01, -1500);
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]The second argument is -1500, it should be in range [0, 1024].
```
