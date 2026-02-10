---
{
    "title": "NUMBERS",
    "language": "en",
    "description": "Table function that generates a temporary table containing only one column with the column name number and all element values are constvalue if "
}
---

## Description

Table function that generates a temporary table containing only one column with the column name `number` and all element values are `const_value` if `const_value` is specified, otherwise they are [0,`number`) incremented.

## Syntax
```sql
NUMBERS(
    "number" = "<number>"
    [, "<const_value>" = "<const_value>" ]
  );
```

## Required Parameters

| Field         | Description               |
|---------------|---------------------------|
| **number**    | The number of rows        |

## Optional Parameters

| Field             | Description                              |
|-------------------|------------------------------------------|
| **const_value**   | Specifies the constant value generated   |



## Return Value
| Field      | Type    | Description                     |
|----------------|---------|---------------------------------|
| **number**     | BIGINT  | The value returned for each row |


## Examples
```sql
select * from numbers("number" = "5");
```
```text
+--------+
| number |
+--------+
|      0 |
|      1 |
|      2 |
|      3 |
|      4 |
+--------+
```

```sql
select * from numbers("number" = "5", "const_value" = "-123");
```
```text
+--------+
| number |
+--------+
|   -123 |
|   -123 |
|   -123 |
|   -123 |
|   -123 |
+--------+
```