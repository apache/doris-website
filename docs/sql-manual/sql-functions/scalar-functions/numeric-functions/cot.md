---
{
    "title": "COT",
    "language": "en"
}
---

## Description

Returns the cotangent of x, where x is the value in radians, only input and output are supported as double. Input null value will return null value.

## Syntax

```sql
COT(<x>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<x>` | The value for which the cotangent is to be calculated |

## Return Value

Returns a Double type value means the cotangent of x.

## Example

```sql
select cot(1),cot(2),cot(1000);
```

```text
+--------------------+----------------------+--------------------+
| cot(1)             | cot(2)               | cot(1000)          |
+--------------------+----------------------+--------------------+
| 0.6420926159343306 | -0.45765755436028577 | 0.6801221323348698 |
+--------------------+----------------------+--------------------+
```

Input null value.

```sql
select cot(null);
```

```text
+--------------------+
| cot(null)          |
+--------------------+
|      NULL          |
+--------------------+
```