---
{
    "title": "BACKENDS",
    "language": "zh-CN"
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

## 描述

表函数，生成 backends 临时表，可以查看当前 doris 集群中的 BE 节点信息。

## 语法
```sql
backends()
```

## 权限控制

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :----------------|:-----------| :------------ |
| ADMIN_PRIV       | 全局         |               |

## 示例
查看 backends 集群信息
```sql
show backends();
select * from backends();
```

```text
+-----------+-----------+---------------+--------+----------+----------+--------------------+---------------------+---------------------+-------+----------------------+-----------+------------------+-------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+----------+-----------+
| BackendId | Host      | HeartbeatPort | BePort | HttpPort | BrpcPort | ArrowFlightSqlPort | LastStartTime       | LastHeartbeat       | Alive | SystemDecommissioned | TabletNum | DataUsedCapacity | TrashUsedCapacity | AvailCapacity | TotalCapacity | UsedPct | MaxDiskUsedPct | RemoteUsedCapacity | Tag                      | ErrMsg | Version                 | Status                                                                                                                                                                                                                 | HeartbeatFailureCounter | NodeRole | CpuCores | Memory    |
+-----------+-----------+---------------+--------+----------+----------+--------------------+---------------------+---------------------+-------+----------------------+-----------+------------------+-------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+----------+-----------+
| 10020     | 10.xx.xx.90 | 9050          | 9060   | 8040     | 8060     | -1               | 2025-01-13 14:11:31 | 2025-01-16 13:24:55 | true  | false                | 359       | 295.328 MB       | 0.000             | 231.236 GB    | 3.437 TB      | 93.43 % | 93.43 %        | 0.000              | {"location" : "default"} |        | doris-0.0.0--83f899b32b | {"lastSuccessReportTabletsTime":"2025-01-16 13:24:07","lastStreamLoadTime":1737004982210,"isQueryDisabled":false,"isLoadDisabled":false,"isActive":true,"currentFragmentNum":0,"lastFragmentUpdateTime":1737004982195} | 0                       | mix      | 96       | 375.81 GB |
+-----------+-----------+---------------+--------+----------+----------+--------------------+---------------------+---------------------+-------+----------------------+-----------+------------------+-------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+----------+-----------+
```

backends() 表结构：
```sql
desc function backends();
```

```text
+-------------------------+---------+------+-------+---------+-------+
| Field                   | Type    | Null | Key   | Default | Extra |
+-------------------------+---------+------+-------+---------+-------+
| BackendId               | bigint  | No   | false | NULL    | NONE  |
| Host                    | text    | No   | false | NULL    | NONE  |
| HeartbeatPort           | int     | No   | false | NULL    | NONE  |
| BePort                  | int     | No   | false | NULL    | NONE  |
| HttpPort                | int     | No   | false | NULL    | NONE  |
| BrpcPort                | int     | No   | false | NULL    | NONE  |
| ArrowFlightSqlPort      | int     | No   | false | NULL    | NONE  |
| LastStartTime           | text    | No   | false | NULL    | NONE  |
| LastHeartbeat           | text    | No   | false | NULL    | NONE  |
| Alive                   | boolean | No   | false | NULL    | NONE  |
| SystemDecommissioned    | boolean | No   | false | NULL    | NONE  |
| TabletNum               | bigint  | No   | false | NULL    | NONE  |
| DataUsedCapacity        | bigint  | No   | false | NULL    | NONE  |
| TrashUsedCapacity       | bigint  | No   | false | NULL    | NONE  |
| AvailCapacity           | bigint  | No   | false | NULL    | NONE  |
| TotalCapacity           | bigint  | No   | false | NULL    | NONE  |
| UsedPct                 | double  | No   | false | NULL    | NONE  |
| MaxDiskUsedPct          | double  | No   | false | NULL    | NONE  |
| RemoteUsedCapacity      | bigint  | No   | false | NULL    | NONE  |
| Tag                     | text    | No   | false | NULL    | NONE  |
| ErrMsg                  | text    | No   | false | NULL    | NONE  |
| Version                 | text    | No   | false | NULL    | NONE  |
| Status                  | text    | No   | false | NULL    | NONE  |
| HeartbeatFailureCounter | int     | No   | false | NULL    | NONE  |
| NodeRole                | text    | No   | false | NULL    | NONE  |
+-------------------------+---------+------+-------+---------+-------+
```