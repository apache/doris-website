---
{
    "title": "TRUNCATE TABLE",
    "language": "en"
}
---

## Description

This statement is used to clear the data of the specified table and partition.

## Syntax

```sql
TRUNCATE TABLE [<db_name>.]<table_name>[ PARTITION ( <partition_name1> [, <partition_name2> ... ] ) ];
```
## Required Parameters

**1.`<db_name>`**
> Specifies the identifier (name) for the database.
>
> Identifiers must begin with an alphabetic character (or any character in a given language if unicode name support is enabled) and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g., `My Database`).
>
> Identifiers cannot use reserved keywords.
>
> See Identifier Requirements and Reserved Keywords for more details.

**2.`<table_name>`**
> Specifies the table identifier (name), which must be unique within the database in which it is located.
>
> Identifiers must begin with an alphabetic character (or any character in a language if unicode name support is enabled) and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g. `My Object`).
>
> Identifiers cannot use reserved keywords.
>
> For more details, see Identifier Requirements and Reserved Keywords.

## Optional Parameters
**1.`<partition_name>`**
> Specifies the identifier (name) of the partition.
>
> Identifiers must begin with an alphabetic character (or any character in a script if unicode name support is enabled) and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g. `My Object`).
>
> Identifiers cannot use reserved keywords.
>
> See Identifier Requirements and Reserved Keywords for more details.


## Access Control Requirements

The user executing this SQL command must have at least the following permissions:


| Privilege       | Object    | Notes                      |
|:----------------|:----------|:---------------------------|
| Drop_priv       | Table     | TRUNCATE TABLE belongs to the table DROP operation |

## Usage Notes

- This statement clears data but retains the table or partition.
- Unlike DELETE, this statement can only clear the specified table or partition as a whole and cannot add filtering conditions.
- Unlike DELETE, clearing data in this way will not affect query performance.
- The data deleted by this operation cannot be recovered.
- When using this command, the table status must be NORMAL, that is, operations such as SCHEMA CHANGE are not allowed.
- This command may cause the import in progress to fail.

## Examples

1. Clear the table tbl under example_db

    ```sql
    TRUNCATE TABLE example_db.tbl;
    ```

2. Clear the p1 and p2 partitions of table tbl

    ```sql
    TRUNCATE TABLE tbl PARTITION(p1, p2);
    ```
