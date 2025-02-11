---
{
   "title": "DROP BROKER",
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

该语句是删除 BROKER 节点。

## 语法

1. 删除所有 Broker
    ```sql
    ALTER SYSTEM DROP ALL BROKER <broker_name>;
    ```

2. 删除某一个 Broker 节点
    ```sql
    ALTER SYSTEM DROP BROKER <broker_name> "<host>:<ipc_port>"[, "<host>:<ipc_port>" [, ...] ];
    ```
## 必选参数

**1. `<broker_name>`**

需要删除的 `broker` 进程的名字。

**2. `<host>`**

需要删除的 `broker` 进程所在节点的 `IP` ，如果启用了 `FQDN`，则使用该节点的 `FQDN`。

**3. `<ipc_port>`**

需要删除的 `broker` 进程所在节点的 `PORT` ，该端口默认值为 `8000`。

## 输出字段
无
## 权限控制
执行该操作的用户需要具备 `NODE_PRIV` 的权限。

## 示例

1. 删除所有 Broker

    ```sql
    ALTER SYSTEM DROP ALL BROKER broker_name；
    ```

2. 删除某一个 Broker 节点

    ```sql
    ALTER SYSTEM DROP BROKER broker_name "10.10.10.1:8000";
    ```