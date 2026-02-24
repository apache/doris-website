---
{
    "title": "AVG",
    "language": "en",
    "description": "Calculates the average of all non-NULL values in a specified column or expression."
}
---

## Description

Calculates the average of all non-NULL values in a specified column or expression.

## Syntax

```sql
AVG([DISTINCT] <expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | It is an expression or column, typically a numeric column or an expression that can be converted to a numeric value. |
| `[DISTINCT]` | It is an optional keyword that indicates the calculation of the average value after removing duplicate values from expr. |

## Return Value

Returns the average value of the selected column or expression. If all records in the group are NULL, the function returns NULL.

## Example

```sql
SELECT datetime, AVG(cost_time) FROM log_statis group by datetime;
```

```text
+---------------------+--------------------+
| datetime            | avg(`cost_time`)   |
+---------------------+--------------------+
| 2019-07-03 21:01:20 | 25.827794561933533 |
+---------------------+--------------------+
```

```sql
SELECT datetime, AVG(distinct cost_time) FROM log_statis group by datetime;
```

```text
+---------------------+---------------------------+
| datetime            | avg(DISTINCT `cost_time`) |
+---------------------+---------------------------+
| 2019-07-04 02:23:24 |        20.666666666666668 |
+---------------------+---------------------------+
```
