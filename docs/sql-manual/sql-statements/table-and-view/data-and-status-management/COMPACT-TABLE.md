---
{
    "title": "COMPACT TABLE",
    "language": "en",
    "description": "Manually triggers a compaction, either for a table partition (ADMIN COMPACT TABLE) or for a single tablet (ADMIN COMPACT TABLET)."
}
---

## Description

Manually triggers a compaction. Doris provides two granularities:

- `ADMIN COMPACT TABLE`: triggers a compaction for all replicas under the specified table partition. Only supported in the storage-computing coupled mode.
- `ADMIN COMPACT TABLET`: triggers a compaction for all replicas of the specified tablet. Supported since version 4.1.4, in both the storage-computing coupled mode and the storage-computing separation mode.

## Syntax

```sql
ADMIN COMPACT TABLE <table_name>
PARTITION <partition_name>
WHERE TYPE={ BASE | CUMULATIVE }
```

```sql
ADMIN COMPACT TABLET <tablet_id>
WHERE TYPE={ BASE | CUMULATIVE | FULL }
```

## Required Parameters

**ADMIN COMPACT TABLE**

<table_name>

> The name of the table for which compaction is to be triggered.

<partition_name>

> The name of the partition for which compaction is to be triggered.

TYPE={ BASE | CUMULATIVE }

> Where BASE refers to triggering a base compaction, and CUMULATIVE refers to triggering a cumulative compaction. For details, refer to the COMPACTION section.

**ADMIN COMPACT TABLET**

<tablet_id>

> The ID of the tablet for which compaction is to be triggered. It must be a tablet of an internal (OLAP) table. Use `SHOW TABLETS FROM <table_name>` to get it.

TYPE={ BASE | CUMULATIVE | FULL }

> In addition to BASE and CUMULATIVE, FULL refers to triggering a full compaction.

## Access Control Requirements

**ADMIN COMPACT TABLE**

The prerequisite for successfully executing this SQL command is to have ADMIN_PRIV permissions. Refer to the permission documentation.

| Privilege  | Object                               | Notes                           |
| :--------- | :----------------------------------- | :------------------------------ |
| ADMIN_PRIV | Entire cluster management privileges | All privileges except NODE_PRIV |

**ADMIN COMPACT TABLET**

The prerequisite for successfully executing this SQL command is to have either the global ADMIN_PRIV privilege or the ALTER_PRIV privilege on the table the tablet belongs to. Either one is sufficient.

| Privilege  | Object                               | Notes                                                              |
| :--------- | :----------------------------------- | :----------------------------------------------------------------- |
| ADMIN_PRIV | Entire cluster management privileges | All privileges except NODE_PRIV                                    |
| ALTER_PRIV | Table                                | The ALTER privilege on the table the tablet belongs to is enough   |

## Example

1. Trigger cumulative compaction for partition par01 of table tbl.

  ```sql
  ADMIN COMPACT TABLE tbl PARTITION par01 WHERE TYPE='CUMULATIVE';
  ```

2. Trigger full compaction for tablet 10086.

  ```sql
  ADMIN COMPACT TABLET 10086 WHERE TYPE='FULL';
  ```

3. Trigger base compaction for tablet 10086.

  ```sql
  ADMIN COMPACT TABLET 10086 WHERE TYPE='BASE';
  ```

## Usage Note

1. `ADMIN COMPACT TABLE` is not supported in the storage-computing separation mode. Executing it in this mode will result in an error, for example:

  ```sql
  ADMIN COMPACT TABLE tbl PARTITION par01 WHERE TYPE='CUMULATIVE';
  ```

  The error message is as follows:

  ```sql
  ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported operation
  ```

  In this case, use `ADMIN COMPACT TABLET` instead.

2. `ADMIN COMPACT TABLET` only supports tablets of internal (OLAP) tables. If the tablet ID does not exist, if the database or table it belongs to has been dropped, or if the index it belongs to is not visible, the statement fails directly, for example:

  ```sql
  ERROR 1105 (HY000): errCode = 2, detailMessage = Unknown tablet: 10086
  ```

3. Both statements only submit a compaction task to the BEs. A successful return does not mean the compaction has finished. Use [SHOW TABLET](./SHOW-TABLET) to watch the number of tablet versions change, or the BE [compaction-status](../../../../admin-manual/open-api/be-http/compaction-status) API to check the progress.
