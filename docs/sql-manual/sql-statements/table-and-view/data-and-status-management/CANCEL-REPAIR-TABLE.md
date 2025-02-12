---
{
    "title": "CANCEL REPAIR TABLE",
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

The `CANCEL REPAIR TABLE` statement is used to cancel high-priority repairs for a specified table or partition. This statement has the following functionalities:

- It can cancel high-priority repairs for an entire table.
- It can cancel high-priority repairs for specified partitions.
- It does not affect the system's default replica repair mechanism.

## Syntax

```sql
ADMIN CANCEL REPAIR TABLE <table_name> [ PARTITION (<partition_name> [, ...]) ];
```

## Required Parameters

**1. `<table_name>`**

> Specifies the name of the table for which the repair is to be canceled.
>
> The table name must be unique within its database.

## Optional Parameters

**1. `PARTITION (<partition_name> [, ...])`**

> Specifies a list of partition names for which the repair is to be canceled.
>
> If this parameter is not specified, it will cancel high-priority repairs for the entire table.

## Access Control Requirements

Users executing this SQL command must have at least the following permissions:

| Privilege       | Object      | Notes                                         |
| :-------------- | :---------- | :-------------------------------------------- |
| ADMIN           | System      | The user must have ADMIN privileges to execute this command. |

## Usage Notes

- This statement only cancels high-priority repairs and does not stop the system's default replica repair mechanism.
- After cancellation, the system will still repair replicas using the default scheduling method.
- If there is a need to re-establish high-priority repairs, the `ADMIN REPAIR TABLE` command can be used.
- The effects of this command take place immediately after execution.

## Examples

- Cancel high-priority repairs for an entire table:

    ```sql
    ADMIN CANCEL REPAIR TABLE tbl;
    ```

- Cancel high-priority repairs for specified partitions:

    ```sql
    ADMIN CANCEL REPAIR TABLE tbl PARTITION(p1, p2);
    ```
