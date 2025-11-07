---
{
    "title": "SHOW CREATE TABLE",
    "language": "en"
}
---

## Description

This statement is used to display the creation statement of the data table.

## Syntax

```sql
SHOW [BRIEF] CREATE TABLE [<db_name>.]<table_name>
```

## Required Parameters
**1.`<table_name>`**
> Specifies the table identifier (name), which must be unique within the database in which it is located.
>
> Identifiers must begin with an alphabetic character (or any character in a language if unicode name support is enabled) and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g. `My Object`).
>
> Identifiers cannot use reserved keywords.
>
> For more details, see Identifier Requirements and Reserved Keywords.

## Optional Parameters
**1.`BRIEF`**
> Display only basic information about the table, excluding column definitions.

**2.`<db_name>`**
> Specifies the identifier (i.e., name) for the database.
>
> Identifiers must begin with an alphabetic character (or any character in a given language if unicode name support is enabled) and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g., `My Database`).
>
> Identifiers cannot use reserved keywords.
>
> See Identifier Requirements and Reserved Keywords for more details.

## Return Value
| column name | description |
| -- |-------------|
| Table | Table name          |
| Create Table | Create table statement        |

## Access Control Requirements

The user executing this SQL command must have at least the following permissions:

| Privilege         | Object    | Notes                           |
|:------------------|:----------|:--------------------------------|
| Select_priv       | Table     | SHOW CREATE TABLE belongs to table SELECT operation |


## Examples

1. View the creation statement of a table

   ```sql
   SHOW CREATE TABLE demo.test_table;
   ```
2. View the simplified table creation statement for a table

   ```sql
   SHOW BRIEF CREATE TABLE demo.test_table;
   ```
