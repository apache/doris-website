---
{
    "title": "DROP FOLLOWER",
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

该语句是删除 FRONTEND 的 FOLLOWER 角色的节点，（仅管理员使用！）

## 语法

```sql
ALTER SYSTEM DROP FOLLOWER "<follower_host>:<edit_log_port>"
```

## 必选参数

**1. `<follower_host>`**

> 可以是 FE 节点的主机名或 IP 地址

**2. `<edit_log_port>`**

> FE 节点的 bdbje 通信端口，默认为 9010

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限        | 对象 | 说明 |
|-----------|----|----|
| NODE_PRIV |    |    |

## 注意事项

1. 在删除 FOLLOWER 节点之前，确保需要下线的节点不是 Master 节点。
2. 在删除 FOLLOWER 节点之前，确保集群中 FOLLOWER 节点在下线之后数量为奇数个。
3. 删除 FOLLOWER 节点后，使用[`SHOW FRONTENDS`](./SHOW-FRONTENDS.md)命令验证它们是否已成功删除。

## 示例

1. 删除一个 FOLLOWER 节点

   ```sql
   ALTER SYSTEM DROP FOLLOWER "host_ip:9010"
   ```
   此命令是删除集群中的一个 FOLLOWER 节点（ IP host_ip，端口 9010）
