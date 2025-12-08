---
{
    "title": "CAST expression",
    "language": "en"
}
---

## Introduction

CAST converts a value of one data type into another data type.
TRY_CAST is a safe type conversion mechanism that returns a SQL NULL value instead of throwing an error when the conversion might fail.

## Syntax

```sql
CAST( <source_expr> AS <target_data_type> )
TRY_CAST( <source_expr> AS <target_data_type> )
```

## Arguments

- source_expr  
  Expression of any supported data type to be converted into a different data type.
- target_data_type  
  The target data type. If the type supports additional properties (for example, precision and scale for DECIMAL(p, s)), include them as needed.

## Strict Mode

Before Doris 4.0, Doris's CAST behavior followed database systems like MySQL, trying to avoid CAST operations from raising errors. For example, in MySQL executing the following SQL:

```sql
select cast('abc' as signed);
```

Would result in:
```
0
```

Starting from Doris 4.0, we've adopted a more rigorous approach, following PostgreSQL's practice: when encountering invalid conversions, Doris will directly report an error rather than generating potentially confusing results.

Doris 4.0 introduced a new variable `enable_strict_cast`, which can be enabled with:

```sql
set enable_strict_cast = true;
```

In strict mode, illegal CAST operations will directly result in errors:

```sql
mysql> select cast('abc' as int);
ERROR 1105 (HY000): errCode = 2, detailMessage = abc can't cast to INT in strict mode.
```

The advantages of strict mode are:
1. It prevents users from getting unexpected values during CAST operations
2. The system can assume that all data can be successfully type-converted (illegal data will directly cause errors), enabling better optimization during computation

## Examples

### Normal CAST Conversion

```sql
SELECT CAST('123' AS INT);
```

```text
+--------------------+
| cast('123' as int) |
+--------------------+
|                123 |
+--------------------+
```

### Using TRY_CAST to Handle Potentially Failed Conversions

When conversions might fail, using TRY_CAST can prevent query errors by returning NULL instead:

```sql
SELECT TRY_CAST('abc' AS INT);
```

```text
+------------------------+
| try_cast('abc' as int) |
+------------------------+
|                   NULL |
+------------------------+
```

## Behavior

We categorize CAST by the target_data_type:

- [Cast to ARRAY](./array-conversion.md)
- [Cast to BOOLEAN](./boolean-conversion.md)
- [Cast to DATE](./date-conversion.md)
- [Cast to TIME](./time-conversion.md)
- [Cast to DATETIME](./datetime-conversion.md)
- [Cast to TIMESTAMPTZ](./timestamptz-conversion.md)
- [Cast to integers (INT, etc.)](./int-conversion.md)
- [Cast to floating point (FLOAT/DOUBLE)](./float-double-conversion.md)
- [Cast to DECIMAL](./decimal-conversion.md)
- [Cast to JSON / From JSON to other types](./json-conversion.md)
- [Cast to MAP](./map-conversion.md)
- [Cast to STRUCT](./struct-conversion.md)
- [Cast to IP](./ip-conversion.md)

## Implicit CAST

Some functions may trigger implicit CASTs, which can lead to unexpected behavior in certain cases.
You can use the EXPLAIN statement to check whether an implicit CAST occurs:

```sql
EXPLAIN SELECT length(123);
```

```text
...
length(CAST(123 AS varchar(65533)))
...
```

You can see from the execution plan above that the system automatically performs a CAST conversion, converting the integer 123 to a string type. This is an example of implicit CAST.

