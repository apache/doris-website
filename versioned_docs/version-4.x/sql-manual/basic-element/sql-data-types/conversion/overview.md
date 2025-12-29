---
{
    "title": "Type Conversion",
    "language": "en",
    "description": "In Doris, each expression has a type, such as 1, col1, and fromunixtime(col2) in the expression select 1, col1, fromunixtime(col2) from table1."
}
---

In Doris, each expression has a type, such as `1`, `col1`, and `from_unixtime(col2)` in the expression `select 1, col1, from_unixtime(col2) from table1`. The process of converting an expression from one type to another is called "type conversion."

Type conversion occurs in two cases: explicit conversion and implicit conversion.

All type conversions follow specific rules. We describe the related rules according to the **target type** of the conversion. For example, converting from `INT` to `DOUBLE` and converting from `STRING` to `DOUBLE` are both described in the [Conversion to FLOAT/DOUBLE](./float-double-conversion) document.

Whether a conversion can occur and whether the result is a nullable type depends on whether strict mode is enabled (session variable `enable_strict_cast`). Generally, when strict mode is enabled, data that fails conversion will immediately cause an error and result in SQL failure. When strict mode is disabled, data rows that fail conversion will result in `NULL`.

## Explicit Conversion

Explicit conversion is done through the `CAST` function, for example:

`CAST(1.23 as INT)` converts the number 1.23 to INT type.

`CAST(colA as DATETIME(6))` converts the column/expression colA to DATETIME(6) type (i.e., a DATETIME type with microsecond precision).

The following describes the type conversion relationships between different types under strict mode (`enable_strict_cast = true`) and non-strict mode (`enable_strict_cast = false`), including the following four cases:

|Symbol|Meaning|
|-|-|
|x|Not allowed to convert|
|P|The return type will be Nullable only when the input parameter is already a Nullable type, i.e., the conversion **will not** convert non-Null values to Null|
|A|The return type is always Nullable. The conversion **may convert non-Null values to Null**|
|O|The return type is Nullable when the conversion from input type to output type **may cause overflow**. For non-Null input values, if the conversion actually causes overflow, the conversion result may be Null|

The specific type conversion rules and Nullable properties, please check the type conversion documents in the current directory.

### Strict Mode

| **From**\\**To** | bool | tinyint | smallint | int | bigint | largeint | float | double | decimal | date | datetime | time | IPv4 | IPv6 | char | varchar | string | bitmap | hll | json | array | map | struct | variant |
| ---------------- | ---- | ------- | -------- | --- | ------ | -------- | ----- | ------ | ------- | ---- | -------- | ---- | ---- | ---- | ---- | ------- | ------ | ------ | --- | ---- | ----- | --- | ------ | ------- |
| bool             | P    | P       | P        | P   | P      | P        | P     | P      | O       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| tinyint          | P    | P       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| smallint         | P    | A       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| int              | P    | A       | A        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| bigint           | P    | A       | A        | A   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| largeint         | P    | A       | A        | A   | A      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| float            | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| double           | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| decimal          | P    | O       | O        | O   | O      | O        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| date             | x    | x       | x        | P   | P      | P        | x     | x      | x       | P    | P        | x    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| datetime         | x    | x       | x        | x   | P      | P        | x     | x      | x       | P    | A        | P    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| time             | x    | A       | A        | A   | P      | P        | x     | x      | x       | P    | P        | A    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| IPv4             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | P    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| IPv6             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| char             | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| varchar          | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| string           | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| bitmap           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    | x    | x       | x      | P      | x   | x    | x     | x   | x      |         |
| hll              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    | x    | x       | x      | x      | P   | x    | x     | x   | x      |         |
| json             | A    | A       | A        | A   | A      | A        | A     | A      | A       | x    | x        | x    | x    | x    | A    | A       | A      | x      | x   | P    | A     | x   | A      |         |
| array            | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | P     | x   | x      |         |
| map              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | x    | x     | P   | x      |         |
| struct           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | P      |         |
| variant          |      |         |          |     |        |          |       |        |         |      |          |      |      |      |      |         |        |        |     |      |       |     |        |         |

### Non-strict Mode

| **From**\\**To** | bool | tinyint | smallint | int | bigint | largeint | float | double | decimal | date | datetime | time | IPv4 | IPv6 | char | varchar | string | bitmap | hll | json | array | map | struct | variant |
| ---------------- | ---- | ------- | -------- | --- | ------ | -------- | ----- | ------ | ------- | ---- | -------- | ---- | ---- | ---- | ---- | ------- | ------ | ------ | --- | ---- | ----- | --- | ------ | ------- |
| bool             | P    | P       | P        | P   | P      | P        | P     | P      | O       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| tinyint          | P    | P       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| smallint         | P    | A       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| int              | P    | A       | A        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| bigint           | P    | A       | A        | A   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| largeint         | P    | A       | A        | A   | A      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| float            | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| double           | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| decimal          | P    | O       | O        | O   | O      | O        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| date             | x    | x       | x        | P   | P      | P        | P     | P      | x       | P    | P        | x    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| datetime         | x    | x       | x        | x   | P      | P        | P     | P      | x       | P    | A        | P    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| time             | x    | A       | A        | A   | P      | P        | P     | P      | x       | P    | P        | A    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| IPv4             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | P    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| IPv6             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| char             | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| varchar          | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| string           | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| bitmap           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    | x    | x       | x      | P      | x   | x    | x     | x   | x      |         |
| hll              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    | x    | x       | x      | x      | P   | x    | x     | x   | x      |         |
| json             | A    | A       | A        | A   | A      | A        | A     | A      | A       | x    | x        | x    | x    | x    | A    | A       | A      | x      | x   | P    | A     | x   | A      |         |
| array            | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | P     | x   | x      |         |
| map              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | x    | x     | P   | x      |         |
| struct           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | P      |         |
| variant          |      |         |          |     |        |          |       |        |         |      |          |      |      |      |      |         |        |        |     |      |       |     |        |         |

## Implicit Conversion

Implicit conversion occurs in certain situations where the input SQL does not explicitly specify, but Doris automatically plans the CAST expression. It mainly occurs in scenarios such as:

1. When a function call is made, the type of the actual parameter does not match the type of the function signature.

2. When the types on both sides of a mathematical expression are inconsistent.

etc.

### Conversion matrix

TODO

### Common Type

When an implicit conversion is required due to the operands being used as mathematical operations, the first step is to determine the common type. If the operands on both sides are not consistent with the common type, each will plan a CAST expression to the common type.

TODO
