---
{
    "title": "SHOW REPLICA DISTRIBUTION",
    "language": "en",
    "description": "This statement is used to display the replica status information for a table or partition."
}
---

## Description

This statement is used to display the replica status information for a table or partition.

## Syntax

```sql
SHOW REPLICA DISTRIBUTION FROM [ <database_name>.]<table_name> [<partition_list>] 
[where_clause]
```
Where:

```sql
partition_list
  : PARTITION (<partition_name>[ , ... ])
```

Where:

```sql
where_clause
: WHERE <output_column_name> = <value>
```

## Required Parameters

**1. `<table_name>`**

> The identifier (i.e., name) of the table, which must be unique within the database (Database).
>
> The identifier must start with a letter character (or any character from supported languages if Unicode name support is enabled), and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g., My Object).
>
> Identifiers cannot use reserved keywords.
>
> For more details, refer to the identifier requirements and reserved keywords.


## Optional Parameters

**1. `<db_name>`**

> The identifier (i.e., name) of the database, which must be unique within the cluster (Cluster).
>
> The identifier must start with a letter character (or any character from supported languages if Unicode name support is enabled), and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g., My Object).
>
> Identifiers cannot use reserved keywords.
>
> For more details, refer to the identifier requirements and reserved keywords.

**2. `<partition_list>`**

> A comma-separated list of partition identifiers (i.e., names), which must be unique within the table (Table).
>
> The identifier must start with a letter character (or any character from supported languages if Unicode name support is enabled), and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g., My Object).
>
> Identifiers cannot use reserved keywords.
>
> For more details, refer to the identifier requirements and reserved keywords.


## Return Value

| Column      | DataType | Note                                                                              |
|-------------|----------|-----------------------------------------------------------------------------------|
| BackendId   | Int      | The ID of the BE (Backend) node where the replica is located.                     |
| ReplicaNum  | Int      | The number of replicas on this BE node.                                           |
| ReplicaSize | Int      | The total storage size occupied by all replicas on this BE node (in bytes).       |
| NumGraph    | String   | A visual representation (using > symbols) of the replica count proportion.        |
| NumPercent  | String   | The percentage representation of the replica count, e.g., 100.00%.                |
| SizeGraph   | String   | A visual representation (using > symbols) of the replica storage size proportion. |
| SizePercent | String   | The percentage representation of the replica storage size, e.g., 100.00%.         |

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege  | Object   | Notes                                                                                                                            |
|:-----------|:---------|:---------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv | Database | Required to execute administrative operations on the database, including managing tables, partitions, and system-level commands. |


## Examples

- 查看表的副本分布

  ```sql
  SHOW REPLICA DISTRIBUTION FROM sell_user;
  ```

  ```text
  *************************** 1. row ***************************
  BackendId: 10009
   ReplicaNum: 4
  ReplicaSize: 8857
     NumGraph: >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
   NumPercent: 100.00%
    SizeGraph: >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  SizePercent: 100.00%
  ```

- 查看表的分区的副本分布

  ```sql
  SHOW REPLICA DISTRIBUTION FROM db1.tbl1 PARTITION(p1, p2);
  ```
