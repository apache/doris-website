---
{
    "title": "SYNC TABLE",
    "language": "en"
}


---

## Description

This statement is used for tables that have the asynchronous group commit feature enabled. 

In the async_mode, write operations return success immediately after the data is written to the memory buffer, without waiting for the data to be committed to disk. But we don't know when the data will be visible.

The `SYNC TABLE` command is used to address this issue. It blocks the current session and waits for the ongoing asynchronous import transaction tasks for the specified table to complete before returning. This ensures that the data from the latest group commit batch is visible after the command finishes.

## Syntax

```sql
SYNC TABLE <table_name> 
```

## Required Parameters

<table_name>

> The name of the table for which to wait for the group commit in async_mode to complete.

## Example

- Create table and set group commit in async_mode.

  ```sql
    CREATE TABLE `dt` (
        `id` int(11) NOT NULL,
        `name` varchar(50) NULL,
    ) ENGINE=OLAP
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 3
    PROPERTIES (
        "replication_num" = "1",
        "group_commit_interval_ms" = "10000"
    );

    SET group_commit = 'async_mode';
  ```

- Insert into some data and after waiting, data becomes visible.
  ```sql
    INSERT INTO dt VALUES (1, "tom"), (2, "jerry");

    sync table dt;

    select * from dt;
    +------+-------+
    | id   | name  |
    +------+-------+
    |    2 | jerry |
    |    1 | tom   |
    +------+-------+
    2 rows in set (0.07 sec)
  ```
## Usage Note

1. This command is not supported in the storage-computing separation mode. Executing it in this mode will result in an error, for example:

  ```sql
  sync table dt;
  ```

  The error message is as follows:

  ```sql
  ERROR 1105 (HY000): errCode = 2, detailMessage = syncTable command not support in cloud mode now.
  ```