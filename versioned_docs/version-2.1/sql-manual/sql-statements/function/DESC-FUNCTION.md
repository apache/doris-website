---
{
    "title": "DESC FUNCTION",
    "language": "en"
}
---

## Description

Use the desc function table_valued_function to obtain the schema information for the corresponding table-valued function.

## Syntax

```sql
DESC FUNCTION <table_valued_function>
```

## Required Parameters

**<table_valued_function>**

> table_valued_function, the name of the table-valued function, such as CATALOGS. For a list of supported table-valued functions, please refer to the "[Table-Valued Functions](https://doris.apache.org/docs/dev/lakehouse/file-analysis)" section

## Examples

Query the information of the table-valued function CATALOGS:

```sql
DESC FUNCTION catalogs();
```

The result is as follows:

```sql
+-------------+--------+------+-------+---------+-------+
| Field       | Type   | Null | Key   | Default | Extra |
+-------------+--------+------+-------+---------+-------+
| CatalogId   | bigint | No   | false | NULL    | NONE  |
| CatalogName | text   | No   | false | NULL    | NONE  |
| CatalogType | text   | No   | false | NULL    | NONE  |
| Property    | text   | No   | false | NULL    | NONE  |
| Value       | text   | No   | false | NULL    | NONE  |
+-------------+--------+------+-------+---------+-------+
```
