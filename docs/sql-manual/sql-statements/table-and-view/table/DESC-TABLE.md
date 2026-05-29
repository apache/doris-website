---
{
    "title": "DESCRIBE",
    "language": "en",
    "description": "This statement is used to display the schema information of the specified table."
}
---

## Description

This statement is used to display the schema information of the specified table.

## Syntax

```sql
DESC[RIBE] [<ctl_name>.][<db_name>.]<table_name> [ALL];
```
## Required Parameters

**1.`<table_name>`**

> Specifies the identifier (i.e., name) of the table, which must be unique within its database.
>
> The identifier must start with a letter character (or any language character if Unicode name support is enabled), and cannot contain spaces or special characters, unless the entire identifier string is enclosed in backticks (e.g., `My Object`).
>
> The identifier cannot use reserved keywords.
>
> For more details, please refer to identifier requirements and reserved keywords.

## Optional Parameters

**1.`<ctl_name>.<db_name>`**

> Specifies the identifier (i.e., name) of the data catalog and database.
>
> The identifier must start with a letter character (or any language character if Unicode name support is enabled), and cannot contain spaces or special characters, unless the entire identifier string is enclosed in backticks (e.g., `My Database`).
>
> The identifier cannot use reserved keywords.
>
> For more details, please refer to identifier requirements and reserved keywords.

**2.`ALL`**

> Only valid for internal tables. Returns all Index information of internal tables.

## Return Value

When `ALL` is not specified, the return value is as follows:

| Column | Description |
| -- |--------------|
| Field | Column name |
| Type | Data type |
| Null | Whether NULL values are allowed |
| Key | Whether it's a key column |
| Default | Default value |
| Extra | Displays some additional information |

In version 3.0.7, a new session variable `show_column_comment_in_describe` was added. When set to `true`, an additional `Comment` column will be added to display column comment information.

When `ALL` is specified, for internal tables, the return value is as follows:

| Column | Description |
| -- |--------------|
| IndexName | Table name |
| IndexKeysType | Table model |
| Field | Column name |
| Type | Data type |
| Null | Whether NULL values are allowed |
| Key | Whether it's a key column |
| Default | Default value |
| Extra | Displays some additional information |
| Visible | Whether it's visible |
| DefineExpr | Definition expression |
| WhereClause | Filter condition related definitions |

## Permission Control

Users executing this SQL command must have at least the following permissions:

| Permission (Privilege) | Object | Notes |
|:--------------| :------------- |:---------------------------------------------|
| SELECT_PRIV   | Table    | When executing DESC, you need to have SELECT_PRIV permission on the queried table |


## Examples

Setup — create the `test_table` used by the examples below:

```sql
CREATE TABLE test_table (
  user_id BIGINT NOT NULL COMMENT 'Key1',
  name    VARCHAR(20)     COMMENT 'username',
  age     INT             COMMENT 'user_age'
) ENGINE=OLAP
UNIQUE KEY (user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

1. Display Base Table Schema

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

Set `show_column_comment_in_describe = true` (introduced in 3.0.7) to add the `Comment` column to the output:

```sql
SET show_column_comment_in_describe=true;
DESC test_table;
```
```text
+---------+-------------+------+-------+---------+-------+----------+
| Field   | Type        | Null | Key   | Default | Extra | Comment  |
+---------+-------------+------+-------+---------+-------+----------+
| user_id | bigint      | No   | true  | NULL    |       | Key1     |
| name    | varchar(20) | Yes  | false | NULL    | NONE  | username |
| age     | int         | Yes  | false | NULL    | NONE  | user_age |
+---------+-------------+------+-------+---------+-------+----------+
```

2. Display the Schema of All Indexes of a Table

```sql
DESC test_table ALL;
```

```text
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
| IndexName  | IndexKeysType | Field   | Type        | InternalType | Null | Key   | Default | Extra | Visible | DefineExpr | WhereClause |
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
| test_table | UNIQUE_KEYS   | user_id | bigint      | bigint       | No   | true  | NULL    |       | true    |            |             |
|            |               | name    | varchar(20) | varchar(20)  | Yes  | false | NULL    | NONE  | true    |            |             |
|            |               | age     | int         | int          | Yes  | false | NULL    | NONE  | true    |            |             |
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
```
