---
{
    "title": "ALTER SYSTEM ADD BACKEND",
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

ADD BACKEND 命令用于向 Doris OLAP 数据库集群添加一个或多个后端节点。此命令允许管理员指定新后端节点的主机和端口，以及可选的属性来配置它们的行为。

## 语法

```sql
   ALTER SYSTEM ADD BACKEND "host:heartbeat_port"[,"host:heartbeat_port"...] [PROPERTIES ("key"="value", ...)];
```

## 参数

* `host`：可以是后端节点的主机名或 IP 地址
* `heartbeat_port`：节点的心跳端口
* `PROPERTIES ("key"="value", ...)`：（可选）一组键值对，用于定义后端节点的附加属性。这些属性可用于自定义正在添加的后端的配置。可用属性包括：

    * tag.location：指定后端节点所属的资源组。例如，PROPERTIES ("tag.location" = "groupb")。
    * tag.compute_group_name：指定后端节点所属的计算组。例如，PROPERTIES ("tag.compute_group_name" = "groupb")。

## 示例

1. 不带附加属性添加后端

    ```sql
    ALTER SYSTEM ADD BACKEND "host1:9050,host2:9050";
    ```

    此命令向集群添加两个后端节点：
    * host1，端口 9050
    * host2，端口 9050

    未指定附加属性，因此将应用默认设置。

2. 添加带有资源组的后端

    ```sql
    ALTER SYSTEM ADD BACKEND "host3:9050" PROPERTIES ("tag.location" = "groupb");
    ```

    此命令将单个后端节点（host3，端口 9050）添加到集群中的资源组 `groupb`。

## 关键词

    ALTER, SYSTEM, ADD, BACKEND, PROPERTIES

## 最佳实践

1. 在添加新的后端节点之前，确保节点已正确配置并运行。

2. 使用资源组可以帮助您更好地管理和组织集群中的后端节点。

3. 添加多个后端节点时，可以在一个命令中指定它们，以提高效率。

4. 添加后端节点后，使用 `SHOW BACKENDS` 命令验证它们是否已成功添加并处于正常状态。

5. 考虑在不同的物理位置或机架上添加后端节点，以提高集群的可用性和容错能力。

6. 定期检查和平衡集群中的负载，确保新添加的后端节点得到适当利用。