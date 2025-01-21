---
{
    "title": "SHOW BROKER",
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

This statement is used to view the status of the currently existing broker processes.

## Syntax：

```sql
SHOW BROKER;
```

## Required Parameters
No Required Parameters

## Output
| Column    | DateType | Note                            |
 |-------|----|---------------------------------|
| Name  | varchar | Broker Process Name             |
| Host  | varchar | Broker Process Node IP          |
| Port  | varchar | Broker Process Node Port        |
| Alive | varchar | Broker Process Node Status      |
| LastStartTime | varchar | Broker Process Last Start Time  |
|LastUpdateTime | varchar | Broker Process Last Update Time |
|ErrMsg | varchar | Error message of the last failed startup of the Broker process            |


## Access Control Requirements
The user executing this statement needs to have the `ADMIN/OPERATOR` permission.

## Examples

1. View the status of the currently existing broker processes
```sql
show broker;
```
```text
+-------------+------------+------+-------+---------------------+---------------------+--------+
| Name        | Host       | Port | Alive | LastStartTime       | LastUpdateTime      | ErrMsg |
+-------------+------------+------+-------+---------------------+---------------------+--------+
| broker_test | 10.10.10.1 | 8196 | true  | 2025-01-21 11:30:10 | 2025-01-21 11:31:40 |        |
+-------------+------------+------+-------+---------------------+---------------------+--------+
```

