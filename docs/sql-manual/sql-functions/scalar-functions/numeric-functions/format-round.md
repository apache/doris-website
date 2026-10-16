---
{
    "title": "FORMAT_ROUND",
    "language": "en",
    "description": "Formats a number in a format similar to \"#,###,###.##\", rounds to the specified decimal places, and returns the result as a string."
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

Returns the formatted string of type STRING. Special cases:

- Returns NULL when the parameter is NULL
- If D is 0, the result will have no decimal point or decimal part. In the Doris 4.1 series since 4.1.5, DECIMAL input is also rounded when D is 0; earlier versions could discard the fractional part without rounding.
- If D is not in [0, 1024], an error is returned indicating the argument should be within this range.

<a id="examples"></a>

## Example

```sql
select format_round(17014116, 2);
```

```text
+---------------------------+
| format_round(17014116, 2) |
+---------------------------+
| 17,014,116.00             |
+---------------------------+
```

```sql
select format_round(1123.456, 2);
```

```text
+---------------------------+
| format_round(1123.456, 2) |
+---------------------------+
| 1,123.46                  |
+---------------------------+
```

```sql
select format_round(1123.4, 2);
```

```text
+-------------------------+
| format_round(1123.4, 2) |
+-------------------------+
| 1,123.40                |
+-------------------------+
```

```sql
select format_round(123456, 0);
```

```text
+-------------------------+
| format_round(123456, 0) |
+-------------------------+
| 123,456                 |
+-------------------------+
```

```sql
select format_round(123456, 3);
```

```text
+-------------------------+
| format_round(123456, 3) |
+-------------------------+
| 123,456.000             |
+-------------------------+
```

```sql
select format_round(123456.123456, 0);
```

```text
+--------------------------------+
| format_round(123456.123456, 0) |
+--------------------------------+
| 123,456                        |
+--------------------------------+
```

```sql
select format_round(123456.123456, 3);
```

```text
+--------------------------------+
| format_round(123456.123456, 3) |
+--------------------------------+
| 123,456.123                    |
+--------------------------------+
```

```sql
select format_round(123456.123456, 6);
```

```text
+--------------------------------+
| format_round(123456.123456, 6) |
+--------------------------------+
| 123,456.123456                 |
+--------------------------------+
```

```sql
SELECT format_round(-0.01, -1);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]The second argument is -1, it should be in range [0, 1024].
```

```sql
SELECT format_round(-0.01, -1500);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]The second argument is -1500, it should be in range [0, 1024].
```

Round DECIMAL input to zero decimal places:

```sql
SELECT FORMAT_ROUND(CAST(1.9 AS DECIMAL(9, 1)), 0),
       FORMAT_ROUND(CAST(-1.9 AS DECIMAL(9, 1)), 0),
       FORMAT_ROUND(CAST(1.4 AS DECIMAL(9, 1)), 0),
       FORMAT_ROUND(CAST(-1.4 AS DECIMAL(9, 1)), 0);
```

```text
2    -2    1    -1
```

NULL input:

```sql
SELECT FORMAT_ROUND(NULL, 2);
```

```text
NULL
```
