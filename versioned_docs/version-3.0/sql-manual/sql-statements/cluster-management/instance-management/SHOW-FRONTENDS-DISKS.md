---
{
"title": "SHOW FRONTENDS DISKS",
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

This statement is used to view the disk information of important directories on the FE node, such as metadata, logs, audit logs, and temporary directories.

## Syntax

```sql
SHOW FRONTENDS DISKS;
```

## Return Value

| Column                 | Note                                              |
|--------------------|-------------------------------------------------|
| Name               | The name of the FE node in bdbje                            |
| Host               | The IP address of the FE node.                                     |
| DirType        | The types of directories to be displayed include the following four categories: meta, log, audit-log, temp, and deploy. |
| Dir           | The directories for the types of directories to be displayed.                                     |
| FileSystem          | The file system in the Linux system where the types of directories to be displayed are located.                      |
| Capacity            | The capacity of the file system.                                         |
| Used | The used size of the file system.                                        |
| Available               | The remaining capacity of the file system.                                       |
| UseRate           | The usage percentage of the file system capacity.                                      |
| MountOn          | The mount directory of the file system.                                        |

## Access Control Requirements

The user who executes this SQL must have at least the following permissions:

| Privilege               | Object | Notes |
|-------------------------|----|----|
| ADMIN_PRIV or NODE_PRIV |    |    |

## Usage Notes

If further filtering of the query results is required, the table-valued function [frontends_disks()](../../../sql-functions/table-valued-functions/frontends_disks.md) can be used. SHOW BACKENDS is equivalent to the following statement:

```sql
SELECT * FROM FRONTENDS_DISKS();
```

## Examples

```sql
SHOW FRONTENDS DISKS; 
```

```text
+-----------------------------------------+-------------+-----------+---------------------------------+------------+----------+------+-----------+---------+------------+
| Name                                    | Host        | DirType   | Dir                             | Filesystem | Capacity | Used | Available | UseRate | MountOn    |
+-----------------------------------------+-------------+-----------+---------------------------------+------------+----------+------+-----------+---------+------------+
| fe_a1daac68_5ec0_477c_b5e8_f90a33cdc1bb | 10.xx.xx.90 | meta      | /home/disk/output/fe/doris-meta | /dev/sdf1  | 7T       | 2T   | 4T        | 36%     | /home/disk |
| fe_a1daac68_5ec0_477c_b5e8_f90a33cdc1bb | 10.xx.xx.90 | log       | /home/disk/output/fe/log        | /dev/sdf1  | 7T       | 2T   | 4T        | 36%     | /home/disk |
| fe_a1daac68_5ec0_477c_b5e8_f90a33cdc1bb | 10.xx.xx.90 | audit-log | /home/disk/output/fe/log        | /dev/sdf1  | 7T       | 2T   | 4T        | 36%     | /home/disk |
| fe_a1daac68_5ec0_477c_b5e8_f90a33cdc1bb | 10.xx.xx.90 | temp      | /home/disk/output/fe/temp_dir   | /dev/sdf1  | 7T       | 2T   | 4T        | 36%     | /home/disk |
| fe_a1daac68_5ec0_477c_b5e8_f90a33cdc1bb | 10.xx.xx.90 | deploy    | /home/disk/output/fe            | /dev/sdf1  | 7T       | 2T   | 4T        | 36%     | /home/disk |
+-----------------------------------------+-------------+-----------+---------------------------------+------------+----------+------+-----------+---------+------------+
```
