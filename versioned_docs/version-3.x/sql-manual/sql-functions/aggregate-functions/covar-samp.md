---
{
    "title": "COVAR_SAMP",
    "language": "en",
    "description": "Computes the sample covariance between two numeric variables."
}
---

## Description

Computes the sample covariance between two numeric variables.

## Syntax

```sql
COVAR_SAMP(<expr1>, <expr2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr1>` | Numeric expression or column |
| `<expr2>` | Numeric expression or column |

## Return Value

Returns the sample covariance of expr1 and expr2, special case:

- If a column of expr1 or expr2 is NULL, the row data will not be counted in the final result.

## Example

```
select covar_samp(x,y) from baseall;
```

```text
+---------------------+
| covar_samp(x, y)    |
+---------------------+
| 0.89442719099991586 |
+---------------------+
```
