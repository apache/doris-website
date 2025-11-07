---
{
    "title": "SHOW REPLICA STATUS",
    "language": "en"
}
---

## Description

This statement is used to display the replica status information for a table or partition.

## Syntax

```sql
SHOW REPLICA STATUS FROM [ <database_name>.]<table_name> [<partition_list>] 
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

**3. `WHERE <output_column_name> = <value>`**

> Specifies the filtering condition for the output. The output_column_name must be part of the output field list.
> 
> When output_column_name is STATUS, the value can be one of the following:
>
> - DEAD:           The backend where the replica resides is unavailable.
> - VERSION_ERROR:  The replica’s data version is incomplete.
> - SCHEMA_ERROR:   The schema hash of the replica is incorrect.
> - MISSING:        The replica does not exist.

## Return Value

| Column             | DataType | Note                                                                      |
|--------------------|----------|---------------------------------------------------------------------------|
| TabletId           | Int      | Unique identifier for the tablet.                                         |
| ReplicaId          | Int      | Unique identifier for the replica.                                        |
| BackendId          | Int      | ID of the Backend (BE) node where the replica is located.                 |
| Version            | Int      | The current version of the replica.                                       |
| LastFailedVersion  | Int      | The version when the replica last failed. A value of -1 means no failure. |
| LastSuccessVersion | Int      | The version when the replica last succeeded.                              |
| CommittedVersion   | Int      | The committed version of the replica.                                     |
| SchemaHash         | Int      | A hash value representing the schema of the replica.                      |
| VersionNum         | Int      | The number of versions the replica has gone through.                      |
| IsBad              | Boolean  | Indicates whether the replica is in a bad state (true/false).             |
| IsUserDrop         | Boolean  | Indicates if the replica has been marked for user-driven deletion.        |
| State              | String   | The current state of the replica (e.g., NORMAL).                          |
| Status             | String   | The health status of the replica (e.g., OK).                              |


## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege  | Object   | Notes                                                                                                                            |
|:-----------|:---------|:---------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv | Database | Required to execute administrative operations on the database, including managing tables, partitions, and system-level commands. |


## Examples

- Display the replica status for all replicas of a table

  ```sql
  SHOW REPLICA STATUS FROM db1.tbl1;
  ```

  ```text
  +----------+-----------+-----------+---------+-------------------+--------------------+------------------+------------+------------+-------+------------+--------+--------+
  | TabletId | ReplicaId | BackendId | Version | LastFailedVersion | LastSuccessVersion | CommittedVersion | SchemaHash | VersionNum | IsBad | IsUserDrop | State  | Status |
  +----------+-----------+-----------+---------+-------------------+--------------------+------------------+------------+------------+-------+------------+--------+--------+
  | 10145    | 10146     | 10009     | 14      | -1                | 14                 | 14               | 182881783  | 1          | false | false      | NORMAL | OK     |
  | 10147    | 10148     | 10009     | 14      | -1                | 14                 | 14               | 182881783  | 1          | false | false      | NORMAL | OK     |
  | 10149    | 10150     | 10009     | 14      | -1                | 14                 | 14               | 182881783  | 1          | false | false      | NORMAL | OK     |
  | 10151    | 10152     | 10009     | 14      | -1                | 14                 | 14               | 182881783  | 1          | false | false      | NORMAL | OK     |
  +----------+-----------+-----------+---------+-------------------+--------------------+------------------+------------+------------+-------+------------+--------+--------+
  ```
  
- Display the replicas of specific partitions with a VERSION_ERROR status

  ```sql
  SHOW REPLICA STATUS FROM tbl1 PARTITION (p1, p2)
  WHERE STATUS = "VERSION_ERROR";
  ```

- Display all replicas of a table that are in unhealthy states

  ```sql
  SHOW REPLICA STATUS FROM tbl1
  WHERE STATUS != "OK";
  ```