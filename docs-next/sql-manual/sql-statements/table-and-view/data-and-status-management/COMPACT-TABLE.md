---
{
    "title": "COMPACT TABLE",
    "language": "en",
    "description": "In the storage-computing coupled mode, this is used to trigger a compaction for all replicas under the specified table partition."
}
---

## Description

In the storage-computing coupled mode, this is used to trigger a compaction for all replicas under the specified table partition.

This command is not supported in the storage-computing separation mode.

## Syntax

```sql
ADMIN COMPACT TABLE <table_name> 
PARTITION <partition_name> 
WHERE TYPE={ BASE | CUMULATIVE }
```

## Required Parameters

<table_name>

> The name of the table for which compaction is to be triggered.

<partition_name>

> The name of the partition for which compaction is to be triggered. (Note: This line should be corrected as it repeats the table name description, it should specify the partition name.)

TYPE={ BASE | CUMULATIVE }

> Where BASE refers to triggering a base compaction, and CUMULATIVE refers to triggering a cumulative compaction. For details, refer to the COMPACTION section.

## Access Control Requirements

The prerequisite for successfully executing this SQL command is to have ADMIN_PRIV permissions. Refer to the permission documentation.

| Privilege  | Object                               | Notes                           |
| :--------- | :----------------------------------- | :------------------------------ |
| ADMIN_PRIV | Entire cluster management privileges | All privileges except NODE_PRIV |

## Example

1. Trigger cumulative compaction for partition par01 of table tbl.

  ```sql
  ADMIN COMPACT TABLE tbl PARTITION par01 WHERE TYPE='CUMULATIVE';
  ```

## Usage Note

1. This command is not supported in the storage-computing separation mode. Executing it in this mode will result in an error, for example:

  ```sql
  ADMIN COMPACT TABLE tbl PARTITION par01 WHERE TYPE='CUMULATIVE';
  ```

  The error message is as follows:

  ```sql
  ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported operation
  ```