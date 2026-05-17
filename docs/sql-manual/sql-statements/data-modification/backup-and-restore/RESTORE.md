---
{
    "title": "RESTORE",
    "language": "en",
    "description": "This statement is used to restore the data backed up by the BACKUP command to the specified database. This command is an asynchronous operation."
}
---

## Description

This statement is used to restore the data backed up by the BACKUP command to the specified database. This command is an asynchronous operation. After the submission is successful, you need to check the progress through the [SHOW RESTORE](./SHOW-RESTORE.md) command.

## Syntax

```sql
RESTORE [GLOBAL] SNAPSHOT [<db_name>.]<snapshot_name>
FROM `<repository_name>`
[ { ON | EXCLUDE } ] (
    `<table_name>` [PARTITION (`<partition_name>`, ...)] [AS `<table_alias>`]
    [, ...] ) ]
)
[ PROPERTIES ( "<key>" = "<value>" [ , ... ] )]
```

## Required Parameters

**1.`<db_name>`**

The name of the database to which the data to be restored belongs

**2.`<snapshot_name>`**

Data snapshot name

**3.`<repository_name>`**

Warehouse name. You can create a repository via [CREATE REPOSITORY](./CREATE-REPOSITORY.md)

**4.`[ PROPERTIES ( "<key>" = "<value>" [ , ... ] ) ]`**

Restoration operation attributes, the format is `<key>` = `<value>`，currently supports the following properties:

- "backup_timestamp" = "2018-05-04-16-45-08": Specifies which time version of the corresponding backup to restore, required. This information can be obtained with the `SHOW SNAPSHOT ON repo;` statement.
- "replication_num" = "3": Specifies the number of replicas for the restored table or partition. Default is 3. If restoring an existing table or partition, the number of replicas must be the same as the number of replicas of the existing table or partition. At the same time, there must be enough hosts to accommodate multiple replicas.
- "reserve_replica" = "true": Default is false. When this property is true, the replication_num property is ignored and the restored table or partition will have the same number of replication as before the backup. Supports multiple tables or multiple partitions within a table with different replication number.
- "reserve_colocate" = "true": Default is false. When this property is false, the colocate property is not restored. When this property is true, the restored table keeps the colocate property.
- "reserve_dynamic_partition_enable" = "true": Default is false. When this property is true, the restored table will have the same value of 'dynamic_partition_enable' as before the backup. if this property is not true, the restored table will set 'dynamic_partition_enable=false'.
- "timeout" = "3600": The task timeout period, the default is one day. in seconds.
- "meta_version" = 40: Use the specified meta_version to read the previously backed up metadata. Note that this parameter is used as a temporary solution and is only used to restore the data backed up by the old version of Doris. The latest version of the backup data already contains the meta version, no need to specify it.
- "clean_tables" : Indicates whether to clean up tables that do not belong to the restore target. For example, if the target db before the restore has tables that are not present in the snapshot, specifying `clean_tables` can drop these extra tables and move them into the recycle bin during the restore.
  - This feature is supported since the Apache Doris 2.1.6  version
- "clean_partitions": Indicates whether to clean up partitions that do not belong to the restore target. For example, if the target table before the restore has partitions that are not present in the snapshot, specifying `clean_partitions` can drop these extra partitions and move them into the recycle bin during the restore.
  - This feature is supported since the Apache Doris 2.1.6  version
- "atomic_restore" - : The data will be loaded into a temporary table first, and then the original table will be replaced atomically to ensure that the read and write of the target table are not affected during the recovery process.
- "force_replace" : Force replace when the table exists and the schema is different with the backup table. 
  - Note that to enable `force_replace`, you must enable `atomic_restore`
- "reserve_privilege" = "true": Whether to restore privileges. Use with `RESTORE GLOBAL`.
- "reserve_catalog" = "true": Whether to restore catalogs. Use with `RESTORE GLOBAL`.
- "reserve_workload_group" = "true": Whether to restore workload groups. Use with `RESTORE GLOBAL`.

## Optional Parameters

**1.`<table_name>`**

The name of the table to be restored. If not specified, the entire database will be restored.

- The tables and partitions that need to be restored are identified in the ON clause. If no partition is specified, all partitions of the table are restored by default. The specified table and partition must already exist in the warehouse backup.
- Tables and partitions that do not require recovery are identified in the EXCLUDE clause. All partitions of all other tables in the warehouse except the specified table or partition will be restored.

**2.`<partition_name>`**

The name of the partition to be restored. If not specified, all partitions of the corresponding table will be restored.

**3.`<table_alias>`**

table alias

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:
| Privilege     | Object    | Notes |
|:--------------|:----------|:------|
| LOAD_PRIV    | USER or ROLE    | This operation can only be performed by users or roles with LOAD_PRIV permissions  |

## Usage Notes

- Restoring tables of type OLAP is only supported.
- There can only be one executing BACKUP or RESTORE task under the same database.
- You can restore the backed up tables in the warehouse to replace the existing tables of the same name in the database, but you must ensure that the table structures of the two tables are exactly the same. The table structure includes: table name, column, partition, Rollup, etc.
- You can specify some partitions of the recovery table, and the system will check whether the partition Range or List can match.
- The table name backed up in the warehouse can be restored to a new table through the AS statement. But the new table name cannot already exist in the database. The partition name cannot be modified.
- Efficiency of recovery operations:In the case of the same cluster size, the time-consuming of the restore operation is basically the same as the time-consuming of the backup operation. If you want to speed up the recovery operation, you can first restore only one copy by setting the `replication_num` parameter, and then adjust the number of copies by [ALTER TABLE PROPERTY](../../../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PROPERTY), complete the copy.

## Example

1. Restore the table backup_tbl in backup snapshot_1 from example_repo to database example_db1, the time version is "2018-05-04-16-45-08". Revert to 1 copy:

```sql
RESTORE SNAPSHOT example_db1.`snapshot_1`
FROM `example_repo`
ON ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2018-05-04-16-45-08",
    "replication_num" = "1"
);
```

2. Restore partitions p1, p2 of table backup_tbl in backup snapshot_2 from example_repo, and table backup_tbl2 to database example_db1, rename it to new_tbl, and the time version is "2018-05-04-17-11-01". The default reverts to 3 replicas:

```sql
RESTORE SNAPSHOT example_db1.`snapshot_2`
FROM `example_repo`
ON
(
    `backup_tbl` PARTITION (`p1`, `p2`),
    `backup_tbl2` AS `new_tbl`
)
PROPERTIES
(
    "backup_timestamp"="2018-05-04-17-11-01"
);
```

3. Restore all tables except for table backup_tbl in backup snapshot_3 from example_repo to database example_db1, the time version is "2018-05-04-18-12-18".

```sql
RESTORE SNAPSHOT example_db1.`snapshot_3`
FROM `example_repo`
EXCLUDE ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2018-05-04-18-12-18"
);
```

4. Restore privileges, catalogs, and workload groups from backup snapshot_4 in example_repo, with time version "2018-05-04-18-12-18".

```sql
RESTORE GLOBAL SNAPSHOT `snapshot_4`
FROM `example_repo`
EXCLUDE ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2018-05-04-18-12-18"
);
```

5. Restore privileges and workload groups from backup snapshot_5 in example_repo, with time version "2018-05-04-18-12-18".

```sql
RESTORE GLOBAL SNAPSHOT `snapshot_5`
FROM `example_repo`
EXCLUDE ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2018-05-04-18-12-18",
    "reserve_privilege" = "true",
    "reserve_workload_group" = "true"
);
```
