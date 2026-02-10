---
{
    "title": "BACKUP",
    "language": "en",
    "description": "This statement is used to back up the data under the specified database. This command is an asynchronous operation."
}
---

## Description

This statement is used to back up the data under the specified database. This command is an asynchronous operation. After submission, you can check progress with the `SHOW BACKUP` command.

## Syntax

```sql
BACKUP [GLOBAL] SNAPSHOT [<db_name>.]<snapshot_name>
TO `<repository_name>`
[ { ON | EXCLUDE } ]
    ( <table_name> [ PARTITION ( <partition_name> [, ...] ) ]
    [, ...] ) ]

[ PROPERTIES ( "<key>" = "<value>" [ , ... ] )]
```

## Required Parameters

**1.`<db_name>`**

The name of the database to which the data to be backed up belongs.

**2.`<snapshot_name>`**

Specify the data snapshot name. The snapshot name cannot be repeated and is globally unique.

**3.`<repository_name>`**

Warehouse name. You can create a repository via [CREATE REPOSITORY](./CREATE-REPOSITORY.md).

## Optional Parameters

**1.`<table_name>`**

The name of the table to be backed up. If not specified, the entire database will be backed up.

- The ON clause identifies the tables and partitions that need to be backed up. If no partition is specified, all partitions of the table are backed up by default
- Tables and partitions that do not require backup are identified in the EXCLUDE clause. Back up all partition data for all tables in this database except the specified table or partition.

**2.`<partition_name>`**

The name of the partition to be backed up. If not specified, all partitions of the corresponding table will be backed up.

**3.`[ PROPERTIES ( "<key>" = "<value>" [ , ... ] ) ]`**

Data snapshot attributes, in the format: `<key>` = `<value>`，currently supports the following properties:

- "type" = "full": indicates that this is a full update (default)
- "timeout" = "3600": The task timeout period, the default is one day. in seconds.
- "backup_privilege" = "true": Whether to back up privileges. Use with `BACKUP GLOBAL`.
- "backup_catalog" = "true": Whether to back up catalogs. Use with `BACKUP GLOBAL`.
- "backup_workload_group" = "true": Whether to back up workload groups. Use with `BACKUP GLOBAL`.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:
| Privilege     | Object    | Notes |
|:--------------|:----------|:------|
| LOAD_PRIV    | USER or ROLE    | This operation can only be performed by users or roles with LOAD_PRIV permissions  |

## Usage Notes

- Only backing up tables of type OLAP is supported.
- Only one backup operation can be performed under the same database.
- The backup operation will back up the underlying table and [Synchronous materialized view](../../../../query-acceleration/materialized-view/sync-materialized-view.md) of the specified table or partition, and only one replica will be backed up. [Asynchronous materialized view](../../../../query-acceleration/materialized-view/async-materialized-view/overview.md) is not supported.
- Efficiency of backup operations:The efficiency of backup operations depends on the amount of data, the number of Compute Nodes, and the number of files. Each Compute Node where the backup data shard is located will participate in the upload phase of the backup operation. The greater the number of nodes, the higher the upload efficiency. The amount of file data refers only to the number of shards, and the number of files in each shard. If there are many shards, or there are many small files in the shards, the backup operation time may be increased.

## Example

1. Fully backup the table example_tbl under example_db to the warehouse example_repo:

```sql
BACKUP SNAPSHOT example_db.snapshot_label1
TO example_repo
ON (example_tbl)
PROPERTIES ("type" = "full");
```

2. Under the full backup example_db, the p1, p2 partitions of the table example_tbl, and the table example_tbl2 to the warehouse example_repo:

```sql
BACKUP SNAPSHOT example_db.snapshot_label2
TO example_repo
ON
(
    example_tbl PARTITION (p1,p2),
    example_tbl2
);
```

3. Full backup of all tables except table example_tbl under example_db to warehouse example_repo:

```sql
BACKUP SNAPSHOT example_db.snapshot_label3
TO example_repo
EXCLUDE (example_tbl);
```

4. Fully back up tables under example_db to the repository example_repo:

```sql
BACKUP SNAPSHOT example_db.snapshot_label3
TO example_repo;
```

5. Back up privileges, catalogs, and workload groups to repository example_repo:

```sql
BACKUP GLOBAL SNAPSHOT snapshot_label5
TO example_repo;
```

6. Back up privileges and catalogs to repository example_repo:

```sql
BACKUP GLOBAL SNAPSHOT snapshot_label6
TO example_repo
PROPERTIES ("backup_privilege" = "true", "backup_catalog" = "true");
```
