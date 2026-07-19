---
{
    "title": "SHOW PARTITION",
    "language": "en",
    "description": "SHOW PARTITION is used to display detailed information about a specified partition. This includes the name and ID of the associated database,"
}
---

## Description

SHOW PARTITION is used to display detailed information about a specified partition. This includes the name and ID of the associated database, the name and ID of the associated table, and the partition name.

## Syntax

```sql
SHOW PARTITION <partition_id>
```

## Required Parameters

**<partition_id>**

> The ID of the partition. The partition ID can be obtained through methods such as SHOW PARTITIONS. For more information, please refer to the "SHOW PARTITIONS" section.

## Access Control Requirements

The user executing this SQL command must have at least `ADMIN_PRIV` permissions.

## Examples

Query partition information for partition ID 13004:

```sql
SHOW PARTITION 13004;
```

If a partition with that ID exists, the output looks like the following — the IDs shown are illustrative, replace `13004` with your actual partition ID (see `SHOW PARTITIONS`). If no partition matches, `SHOW PARTITION` returns an empty result set.

```sql
+--------+-----------+---------------+-------+---------+
| DbName | TableName | PartitionName | DbId  | TableId |
+--------+-----------+---------------+-------+---------+
| ods    | sales     | sales         | 13003 | 13005   |
+--------+-----------+---------------+-------+---------+
```