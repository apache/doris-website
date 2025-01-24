---
{
    "title": "SHOW BACKENDS",
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

该语句用于查看 BE 节点的基本状态信息。

## 语法

```sql
 SHOW BACKENDS
```

## 返回值

| 列名                      | 说明                                                                                                               |
|-------------------------|------------------------------------------------------------------------------------------------------------------|
| BackendId               | 当前 BE 的 ID                                                                                                       |
| Host                    | 当前 BE 的 IP 地址或主机名                                                                                                |
| HeartbeatPort           | 当前 BE 的心跳服务通信端口                                                                                                  |
| BePort                  | 当前 BE 的 thrift RPC 通信端口                                                                                          |
| HttpPort                | 当前 BE 的 http 通信端口                                                                                                |
| BrpcPort                | 当前 BE 的 bRPC 通信端口                                                                                                |
| ArrowFlightSqlPort      | 当前 BE 的 ArrowFlight 协议通信端口                                                                                       |
| LastStartTime           | 当前 BE 启动的时间戳                                                                                                     |
| LastHeartbeat           | 当前 BE 上一次成功发送心跳的时间戳                                                                                              |
| Alive                   | 当前 BE 是否存活                                                                                                       |
| SystemDecommissioned    | 该值为 true 时，表示当前 BE 节点正在安全下线中                                                                                     |
| TabletNum               | 当前 BE 上存储的数据分片数量                                                                                                 |
| DataUsedCapacity        | 当前 BE 数据所占用的磁盘空间                                                                                                 |
| TrashUsedCapacity       | 当前 BE 垃圾回收站中数据所占用的磁盘空间                                                                                           |
| AvailCapacity           | 当前 BE 可用的磁盘空间                                                                                                    |
| TotalCapacity           | 当前 BE 总的磁盘空间，TotalCapacity = AvailCapacity + TrashUsedCapacity + DataUsedCapacity + 其他非用户数据文件占用空间                |
| UsedPct                 | 当前 BE 所有磁盘总的已使用量百分比                                                                                              |
| MaxDiskUsedPct          | 当前 BE 所有磁盘的已使用量百分比中最大的一个                                                                                         |
| RemoteUsedCapacity      | 当前 BE 在使用了冷热分层功能后，上传到远端存储的数据占用空间                                                                                 |
| Tag                     | 当前 BE 的标签信息，以 JSON 格式展示，不同部署模式下的保存的标签信息不同，存算一体模式下保存当前 BE 资源组名称，存算分离模式下保存一些额外的信息                                  |
| ErrMsg                  | 当前 BE 心跳失败时的错误信息                                                                                                 |
| Version                 | 当前 BE 的版本信息                                                                                                      |
| Status                  | 当前 BE 的一些状态信息，以 JSON 格式展示，包括：上一次成功上报 tablet 的时间、上一次 StreamLoad 的时间、是否允许查询、是否允许导入等，需要注意的是，不同版本保存的信息会有些许差异         |
| HeartbeatFailureCounter | 当前 BE 连续失败的心跳次数，如果次数超过 FE Master 配置`max_backend_heartbeat_failure_tolerance_count`（默认值为 1），则 `Alive` 字段会置为 false |
| NodeRole                | 当前 BE 的角色，有两种：`mix`是默认的角色，`computation`表示当前节点只用于联邦分析查询                                                           |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象 | 说明 |
|------------|----|----|
| ADMIN_PRIV |    |    |

## 注意事项

如果需要对查询结果进行进一步的过滤，可以使用表值函数[backends()](../../../sql-functions/table-valued-functions/backends.md)。`SHOW BACKENDS` 与下面语句等价：

```sql
SELECT * FROM BACKENDS();
```

## 示例

```sql
SHOW BACKENDS;
```

```text
+-----------+-----------+---------------+--------+----------+----------+--------------------+---------------------+---------------------+-------+----------------------+-----------+------------------+-------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-----------------------------+------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+
| BackendId | Host      | HeartbeatPort | BePort | HttpPort | BrpcPort | ArrowFlightSqlPort | LastStartTime       | LastHeartbeat       | Alive | SystemDecommissioned | TabletNum | DataUsedCapacity | TrashUsedCapacity | AvailCapacity | TotalCapacity | UsedPct | MaxDiskUsedPct | RemoteUsedCapacity | Tag                      | ErrMsg | Version                     | Status                                                                                                                                   | HeartbeatFailureCounter | NodeRole |
+-----------+-----------+---------------+--------+----------+----------+--------------------+---------------------+---------------------+-------+----------------------+-----------+------------------+-------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-----------------------------+------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+
| 10002     | 127.0.0.1 | 9050          | 9060   | 8040     | 8060     | 10040              | 2025-01-20 02:11:39 | 2025-01-21 11:52:40 | true  | false                | 281       | 9.690 MB         | 0.000             | 10.505 GB     | 71.750 GB     | 85.36 % | 85.36 %        | 0.000              | {"location" : "default"} |        | doris-2.1.7-rc03-443e87e203 | {"lastSuccessReportTabletsTime":"2025-01-21 11:51:59","lastStreamLoadTime":1737460114345,"isQueryDisabled":false,"isLoadDisabled":false} | 0                       | mix      |
+-----------+-----------+---------------+--------+----------+----------+--------------------+---------------------+---------------------+-------+----------------------+-----------+------------------+-------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-----------------------------+------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+
```
