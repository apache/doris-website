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
BACKENDS()
```

## 权限控制

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :----------------|:-----------| :------------ |
| ADMIN_PRIV       | 全局         |               |

## 返回值
| Field                       | Description                                         |
|-----------------------------|-----------------------------------------------------|
| **BackendId**               | 每个 Backend 节点的唯一标识符。                                |
| **Host**                    | Backend 节点的 IP 地址或主机名。                              |
| **HeartbeatPort**           | 用于健康检查（心跳）的端口。                                      |
| **BePort**                  | Backend 节点与集群通信时使用的端口。                              |
| **HttpPort**                | Backend 节点的 HTTP 端口。                                |
| **BrpcPort**                | 用于 BRPC 通信的端口。                                      |
| **ArrowFlightSqlPort**      | Arrow Flight SQL 端口（用于与 Apache Arrow 集成，进行高性能数据传输）。 |
| **LastStartTime**           | Backend 节点最后一次启动的时间戳。                               |
| **LastHeartbeat**           | 接收到的最后一次心跳时间戳。                                      |
| **Alive**                   | Backend 节点是否处于活动状态（True/False）。                     |
| **SystemDecommissioned**    | 该 Backend 节点是否已被弃用。                                 |
| **TabletNum**               | 该 Backend 节点管理的 Tablet 数量。                          |
| **DataUsedCapacity**        | 该 Backend 节点使用的磁盘空间（以 MB 为单位）。                      |
| **TrashUsedCapacity**       | 该 Backend 节点垃圾空间的使用情况（以 MB 为单位）。                    |
| **AvailCapacity**           | 该 Backend 节点的可用磁盘空间。                                |
| **TotalCapacity**           | 该 Backend 节点的总磁盘容量。                                 |
| **UsedPct**                 | 该 Backend 节点的磁盘使用百分比。                               |
| **MaxDiskUsedPct**          | 所有 Tablet 的最大磁盘使用百分比。                               |
| **RemoteUsedCapacity**      | 远程存储的磁盘空间使用情况（如果适用）。                                |
| **Tag**                     | 与 Backend 节点关联的标签，通常用于节点分类（例如，位置等）。                 |
| **ErrMsg**                  | Backend 节点的错误信息。                                    |
| **Version**                 | Backend 节点的版本。                                      |
| **Status**                  | Backend 节点的当前状态，包括 Tablet 的成功/失败报告、加载时间和查询状态等。      |
| **HeartbeatFailureCounter** | 心跳失败的计数，如果有的话。                                      |
| **NodeRole**                | Backend 节点的角色，例如 `mix` 表示节点同时处理存储和查询。               |
| **CpuCores**                | Backend 节点的 CPU 核心数。                                |
| **Memory**                  | Backend 节点的内存大小。                                    |


## 示例
查看 backends 集群信息
```sql
select * from backends();
```

```text
+-----------+-----------+---------------+--------+----------+----------+--------------------+---------------------+---------------------+-------+----------------------+-----------+------------------+-------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+----------+-----------+
| BackendId | Host      | HeartbeatPort | BePort | HttpPort | BrpcPort | ArrowFlightSqlPort | LastStartTime       | LastHeartbeat       | Alive | SystemDecommissioned | TabletNum | DataUsedCapacity | TrashUsedCapacity | AvailCapacity | TotalCapacity | UsedPct | MaxDiskUsedPct | RemoteUsedCapacity | Tag                      | ErrMsg | Version                 | Status                                                                                                                                                                                                                 | HeartbeatFailureCounter | NodeRole | CpuCores | Memory    |
+-----------+-----------+---------------+--------+----------+----------+--------------------+---------------------+---------------------+-------+----------------------+-----------+------------------+-------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+----------+-----------+
| 10020     | 10.xx.xx.90 | 9050          | 9060   | 8040     | 8060     | -1               | 2025-01-13 14:11:31 | 2025-01-16 13:24:55 | true  | false                | 359       | 295.328 MB       | 0.000             | 231.236 GB    | 3.437 TB      | 93.43 % | 93.43 %        | 0.000              | {"location" : "default"} |        | doris-0.0.0--83f899b32b | {"lastSuccessReportTabletsTime":"2025-01-16 13:24:07","lastStreamLoadTime":1737004982210,"isQueryDisabled":false,"isLoadDisabled":false,"isActive":true,"currentFragmentNum":0,"lastFragmentUpdateTime":1737004982195} | 0                       | mix      | 96       | 375.81 GB |
+-----------+-----------+---------------+--------+----------+----------+--------------------+---------------------+---------------------+-------+----------------------+-----------+------------------+-------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+----------+-----------+
```