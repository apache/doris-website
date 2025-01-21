---
{
    "title": "SHOW PARTITION",
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

Results:

```sql
+--------+-----------+---------------+-------+---------+
| DbName | TableName | PartitionName | DbId  | TableId |
+--------+-----------+---------------+-------+---------+
| ods    | sales     | sales         | 13003 | 13005   |
+--------+-----------+---------------+-------+---------+
```