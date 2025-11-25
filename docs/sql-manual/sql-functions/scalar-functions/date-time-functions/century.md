---
{
    "title": "CENTURY",
    "language": "en"
}
---

## Description

The century corresponding to the given date

## Syntax

```sql
century(`<date_or_time_expr>`)
```

## Parameters

| Parameter | Description |  
| -- | -- |  
| `<date_or_time_expr>` | The input date, which returns the corresponding century and supports error type handling.  |  

## Return Value  

The century corresponding to the given date

- When date is a valid date, returns the corresponding century
- When date is not in the supported date range [0001-01-01, 9999-12-31], returns NULL
- When date is NULL or cannot be parsed as a valid date, returns NULL

## Examples

```sql
select century('2024-01-01');
```

```text
+-----------------------+
| century('2024-01-01') |
+-----------------------+
|                    21 |
+-----------------------+
```

```sql
select century('1999-12-31');
```

```text
+------------------------+
| century('1999-12-31')  |
+------------------------+
|                     20 |
+------------------------+
```

```sql
select century('0000-12-25');
```

```text
+------------------------+
| century('0000-12-25')  |
+------------------------+
|                   NULL |
+------------------------+
```

```sql
select century('10000-01-01');
```

```text
+-------------------------+
| century('10000-01-01')  |
+-------------------------+
|                    NULL |
+-------------------------+
```

```sql
select century(NULL);
```

```text
+----------------+
| century(NULL)  |
+----------------+
|           NULL |
+----------------+
```

```sql
select century('invalid-date');
```

```text
+--------------------------+
| century('invalid-date')  |
+--------------------------+
|                     NULL |
+--------------------------+
```
