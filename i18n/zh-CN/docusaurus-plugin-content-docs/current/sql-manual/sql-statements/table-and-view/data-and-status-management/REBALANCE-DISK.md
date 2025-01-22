---
{
    "title": "REBALANCE DISK",
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

REBALANCE DISK 语句用于优化 BE（Backend）节点上的数据分布。该语句具有以下功能：

- 可以针对指定的 BE 节点进行数据均衡
- 可以对整个集群的所有 BE 节点进行数据均衡
- 优先均衡指定节点的数据，不受集群整体均衡状态的限制

## 语法

```sql
ADMIN REBALANCE DISK [ ON ( "<host>:<port>" [, ... ] ) ];
```

## 可选参数

**1. `"<host>:<port>"`**

> 指定需要进行数据均衡的 BE 节点列表。
>
> 每个节点由主机名（或 IP 地址）和心跳端口组成。
>
> 如果不指定此参数，则对所有 BE 节点进行均衡。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                           |
| :---------------- | :------------- | :-------------------------------------- |
| ADMIN             | 系统          | 用户必须拥有 ADMIN 权限才能执行该命令    |

## 注意事项

- 命令的默认超时时间为 24 小时。超时后，系统将不再优先均衡指定的 BE 磁盘数据。如需继续均衡，需要重新执行该命令。
- 当指定 BE 节点的磁盘数据均衡完成后，该节点的优先均衡设置将自动失效。
- 该命令可以在集群非均衡状态下执行。

## 示例

- 对集群内所有 BE 节点进行数据均衡：

```sql
ADMIN REBALANCE DISK;
```

- 对指定的两个 BE 节点进行数据均衡：

```sql
ADMIN REBALANCE DISK ON ("192.168.1.1:1234", "192.168.1.2:1234");
```
