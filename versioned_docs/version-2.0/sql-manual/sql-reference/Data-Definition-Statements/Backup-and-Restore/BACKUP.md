---
{
    "title": "BACKUP",
    "language": "en"
}
---

## BACKUP

### Name

BACKUP

### Description

This statement is used to back up the data under the specified database. This command is an asynchronous operation. After the submission is successful, you need to check the progress through the SHOW BACKUP command. Only backing up tables of type OLAP is supported.

 Only root or superuser users can create repositories.

grammar:

```sql
BACKUP SNAPSHOT [db_name].{snapshot_name}
TO `repository_name`
[ON|EXCLUDE] (
    `table_name` [PARTITION (`p1`, ...)],
    ...
)
PROPERTIES ("key"="value", ...);
```

illustrate:

- There can only be one executing BACKUP or RESTORE task under the same database.
- The ON clause identifies the tables and partitions that need to be backed up. If no partition is specified, all partitions of the table are backed up by default
- Tables and partitions that do not require backup are identified in the EXCLUDE clause. Back up all partition data for all tables in this database except the specified table or partition.
- PROPERTIES currently supports the following properties:
  - "type" = "full": indicates that this is a full update (default)
  - "timeout" = "3600": The task timeout period, the default is one day. in seconds.

### Example

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

### Keywords

BACKUP

### Best Practice

1. Only one backup operation can be performed under the same database.

2. The backup operation will back up the underlying table and [Synchronous materialized view](../../../../query/view-materialized-view/materialized-view.md) of the specified table or partition, and only one replica will be backed up. [Asynchronous materialized view](../../../../query/view-materialized-view/async-materialized-view.md) is not supported.

3. Efficiency of backup operations

   The efficiency of backup operations depends on the amount of data, the number of Compute Nodes, and the number of files. Each Compute Node where the backup data shard is located will participate in the upload phase of the backup operation. The greater the number of nodes, the higher the upload efficiency.

   The amount of file data refers only to the number of shards, and the number of files in each shard. If there are many shards, or there are many small files in the shards, the backup operation time may be increased.
