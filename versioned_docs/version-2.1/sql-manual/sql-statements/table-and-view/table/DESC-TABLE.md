---
{
    "title": "DESC TABLE",
    "language": "en"
}
---

## Description

This statement is used to display the schema information of the specified table.

## Syntax

```sql
DESC[RIBE] [db_name.]table_name [ALL];
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

**1.`<db_name>`**
> Specifies the identifier (i.e., name) for the database.
>
> Identifiers must begin with an alphabetic character (or any character in a given language if unicode name support is enabled) and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g., `My Database`).
>
> Identifiers cannot use reserved keywords.
>
> See Identifier Requirements and Reserved Keywords for more details.

**2.`RIBE`**
> Returns description information of all columns in a table

**3.`ALL`**
> Returns description information for all columns

## Return Value

| column name | description                       |
| -- |-----------------------------------|
| IndexName | Table name                        |
| IndexKeysType | Table Model                       |
| Field | Column Name                       |
| Type | Data Types                        |
| Null | Whether NULL values are allowed |
| Key | Is it a key column                           |
| Default | Default Value                     |
| Extra | Display some additional information                         |
| Visible | Visible                              |
| DefineExpr | Defining Expressions                             |
| WhereClause | Filter Conditions Related Definitions                       |

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:

| Privilege    | Object    | Notes                                                                                         |
|:-------------|:----------|:----------------------------------------------------------------------------------------------|
| SELECT_PRIV  | Table     | When executing DESC, you need to have the SELECT_PRIV privilege on the table being queried    |

## Usage Notes
- If ALL is specified, the schema of all indexes (rollup) of the table is displayed.


## Examples

1. Display the Base table schema

```sql
DESC test_table;
```
```text
+---------+-------------+------+-------+---------+-------+
| Field   | Type        | Null | Key   | Default | Extra |
+---------+-------------+------+-------+---------+-------+
| user_id | bigint      | No   | true  | NULL    |       |
| name    | varchar(20) | Yes  | false | NULL    | NONE  |
| age     | int         | Yes  | false | NULL    | NONE  |
+---------+-------------+------+-------+---------+-------+
```

2. Display the schema of all indexes in the table

```sql
DESC demo.test_table ALL;
```

```text
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
| IndexName  | IndexKeysType | Field   | Type        | InternalType | Null | Key   | Default | Extra | Visible | DefineExpr | WhereClause |
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
| test_table | DUP_KEYS      | user_id | bigint      | bigint       | No   | true  | NULL    |       | true    |            |             |
|            |               | name    | varchar(20) | varchar(20)  | Yes  | false | NULL    | NONE  | true    |            |             |
|            |               | age     | int         | int          | Yes  | false | NULL    | NONE  | true    |            |             |
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
```


