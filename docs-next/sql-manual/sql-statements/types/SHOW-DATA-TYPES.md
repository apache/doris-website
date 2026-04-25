---
{
    "title": "SHOW DATA TYPES",
    "language": "en",
    "description": "This statement is used to view all supported data types."
}
---

## Description

    This statement is used to view all supported data types.

## Syntax

```sql
SHOW DATA TYPES;
```

## Return Value

| Column Name | Description      |
|-------------|------------------|
| TypeName    | Name of the type |
| Size        | Size in bytes    |

## Access Control Requirements

The user executing this SQL command does not require specific privileges.

## Example

- Display all supported data types

    ```sql
    SHOW DATA TYPES;
    ```
    ```text
    +----------------+------+
    | TypeName       | Size |
    +----------------+------+
    | AGG_STATE      | 16   |
    | ARRAY          | 32   |
    | BIGINT         | 8    |
    | BITMAP         | 16   |
    | BOOLEAN        | 1    |
    | CHAR           | 16   |
    | DATE           | 16   |
    | DATETIME       | 16   |
    | DATETIMEV2     | 8    |
    | DATEV2         | 4    |
    | DECIMAL128     | 16   |
    | DECIMAL32      | 4    |
    | DECIMAL64      | 8    |
    | DECIMALV2      | 16   |
    | DOUBLE         | 8    |
    | FLOAT          | 4    |
    | HLL            | 16   |
    | INT            | 4    |
    | IPV4           | 4    |
    | IPV6           | 16   |
    | JSON           | 16   |
    | LARGEINT       | 16   |
    | MAP            | 24   |
    | QUANTILE_STATE | 16   |
    | SMALLINT       | 2    |
    | STRING         | 16   |
    | TINYINT        | 1    |
    | VARCHAR        | 16   |
    +----------------+------+
    ```

