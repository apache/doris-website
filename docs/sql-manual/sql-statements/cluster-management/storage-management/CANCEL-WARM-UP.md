---
{
"title": "CANCEL WARM UP",
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

For terminating a specified warm-up job in Doris.

## Syntax

```sql
CANCEL WARM UP JOB WHERE id = <id>;
```
## Required Parameters

> The id of the warm-up job you want to terminate, which can be queried through the command `SHOW WARM UP JOB`.

## Permission Control

The user executing this SQL command must have at least ADMIN_PRIV permissions.

## Example

Query the warm-up jobs currently running in the system through `SHOW WARM UP JOB`:

```sql
SHOW WARM UP JOB
```

Its result is:

```C++
+----------------+---------------+---------+-------+-------------------------+-------------+----------+------------+--------+
| JobId          | ClusterName   | Status  | Type  | CreateTime              | FinishBatch | AllBatch | FinishTime | ErrMsg |
+----------------+---------------+---------+-------+-------------------------+-------------+----------+------------+--------+
| 90290165739458 | CloudCluster1 | RUNNING | TABLE | 2024-11-11 11:11:42.700 | 1           | 3        | NULL       |        |
+----------------+---------------+---------+-------+-------------------------+-------------+----------+------------+--------+
```

Then terminate it through `CANCEL WARM UP`:

```C++
CANCEL WARM UP WHERE id = 90290165739458;
```

If the following content is returned, it indicates that the warm-up job corresponding to the specified id does not exist:

```C++
ERROR 1105 (HY000): errCode = 2, detailMessage = job id: 110 does not exist.
```

After a successful return, `SHOW WARM UP JOB` can be used again to see that the job status has changed from RUNNING to CANCELLED:

```C++
+----------------+---------------+-----------+-------+-------------------------+-------------+----------+-------------------------+-------------+
| JobId          | ClusterName   | Status    | Type  | CreateTime              | FinishBatch | AllBatch | FinishTime              | ErrMsg      |
+----------------+---------------+-----------+-------+-------------------------+-------------+----------+-------------------------+-------------+
| 90290165739458 | CloudCluster1 | CANCELLED | TABLE | 2024-11-11 11:11:42.700 | 1           | 3        | 2024-11-11 11:11:43.700 | user cancel |
+----------------+---------------+-----------+-------+-------------------------+-------------+----------+-------------------------+-------------+
```