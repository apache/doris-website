---
{
    "title": "REPAIR TABLE",
    "language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->


## Description

The `REPAIR TABLE` statement is used to prioritize the repair of replicas for a specified table or partition. This statement has the following functionalities:

- It can repair all replicas of an entire table.
- It can repair replicas of specified partitions.
- It performs replica repairs with high priority.
- It supports setting a repair timeout.

## Syntax

```sql
ADMIN REPAIR TABLE <table_name> [ PARTITION (<partition_name> [, ...]) ];
```

## Required Parameters

**1. `<table_name>`**

> Specifies the name of the table that needs to be repaired.
>
> The table name must be unique within its database.

## Optional Parameters

**1. `PARTITION (<partition_name> [, ...])`**

> Specifies a list of partition names that need to be repaired.
>
> If this parameter is not specified, it will repair all partitions of the entire table.

## Access Control Requirements

Users executing this SQL command must have at least the following permissions:

| Privilege       | Object      | Notes                                         |
| :-------------- | :---------- | :-------------------------------------------- |
| ADMIN           | System      | The user must have ADMIN privileges to execute this command. |

## Usage Notes

- This statement indicates that the system will attempt to repair the specified replicas with high priority, but it does not guarantee successful repairs.
- The default timeout is set to 14,400 seconds (4 hours).
- After the timeout, the system will no longer prioritize the repair of specified replicas.
- If a repair times out, the command needs to be executed again to continue the repair process.
- The progress of repairs can be monitored using the `SHOW REPLICA STATUS` command.
- This command does not affect the normal replica repair mechanism of the system; it merely elevates the priority of repairs for the specified table or partition.

## Examples

- Repair all replicas of an entire table:

    ```sql
    ADMIN REPAIR TABLE tbl1;
    ```

- Repair replicas of specified partitions:

    ```sql
    ADMIN REPAIR TABLE tbl1 PARTITION (p1, p2);
    ```

- Check the repair progress:

    ```sql
    SHOW REPLICA STATUS FROM tbl1;
    ```
