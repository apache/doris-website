---
{
    "title": "CAST expression",
    "language": "en"
}
---
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

## Examples

Normal CAST conversion:

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

In strict mode, some invalid CAST conversions may result in errors:

```sql
SELECT CAST('abc' AS INT);
```

```text
[INVALID_ARGUMENT]parse number fail, string: 'abc'
```

In such cases, you can use TRY_CAST to avoid errors and convert failed conversions to NULL values:

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

You can see from the execution plan above that the system automatically performs a CAST conversion, converting the integer 123 to a string type.

